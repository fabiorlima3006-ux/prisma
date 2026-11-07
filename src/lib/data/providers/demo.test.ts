import { describe, expect, it } from 'vitest';
import { getAsset } from '../catalog';
import type { Asset } from '../types';
import { createDemoProvider } from './demo';

function need(cls: 'stock' | 'index', slug: string): Asset {
  const a = getAsset(cls, slug);
  if (!a) throw new Error('catálogo incompleto');
  return a;
}
const petr4 = need('stock', 'petr4');
const ibov = need('index', 'ibov');
const provider = createDemoProvider({ now: () => new Date('2026-11-07T12:00:00Z') });

async function history(range: '1m' | '6m' | '1y' = '1y') {
  const r = await provider.getHistory!(petr4, range);
  if (r.status !== 'ok') throw new Error('esperava ok');
  return r;
}

describe('demo provider', () => {
  it('é determinístico e marcado como demo', async () => {
    const a = await provider.getHistory!(petr4, '1y');
    const b = await provider.getHistory!(petr4, '1y');
    expect(a).toEqual(b);
    if (a.status !== 'ok') throw new Error('esperava ok');
    expect(a.meta).toEqual({
      source: 'demo',
      isDemo: true,
      asOf: '2026-11-07T12:00:00.000Z',
      attribution: 'Dados demonstrativos gerados pela plataforma',
    });
  });

  it('gera 252 dias úteis e recortes por faixa', async () => {
    const h = await history('1y');
    expect(h.data).toHaveLength(252);
    expect((await history('6m')).data).toHaveLength(126);
    expect((await history('1m')).data).toHaveLength(21);
    for (const p of h.data) {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const dow = new Date(`${p.date}T12:00:00Z`).getUTCDay();
      expect([0, 6]).not.toContain(dow);
      expect(p.close).toBeGreaterThan(0);
    }
    expect(h.data.at(-1)?.date).toBe('2026-11-06');
  });

  it('cotação deriva do histórico', async () => {
    const h = await history('1y');
    const q = await provider.getQuote!(petr4);
    if (q.status !== 'ok') throw new Error('esperava ok');
    expect(q.meta.source).toBe('demo');
    const closes = h.data.map((p) => p.close);
    expect(q.data.price).toBe(closes[251]);
    expect(q.data.change.day).toBeCloseTo(closes[251]! / closes[250]! - 1, 12);
    expect(q.data.change.week).toBeCloseTo(closes[251]! / closes[246]! - 1, 12);
    expect(q.data.change.month).toBeCloseTo(closes[251]! / closes[230]! - 1, 12);
    expect(q.data.change.year).toBeCloseTo(closes[251]! / closes[0]! - 1, 12);
    expect(q.data.high52w).toBe(Math.max(...closes));
    expect(q.data.low52w).toBe(Math.min(...closes));
    expect(q.data.volume).toBeNull();
    expect(q.data.dayHigh).toBeNull();
    expect(q.data.dayLow).toBeNull();
  });

  it('usa base 10000 para índices e difere por ticker', async () => {
    const h = await provider.getHistory!(ibov, '1y');
    if (h.status !== 'ok') throw new Error('esperava ok');
    expect(h.data[0]!.close).toBeGreaterThan(5000);
    expect(h.data[0]!.close).toBeLessThan(20000);
    expect(h.data).not.toEqual((await history('1y')).data);
  });

  it('não fornece fundamentos nem indicadores', () => {
    expect(provider.getFundamentals).toBeUndefined();
    expect(provider.getIndicator).toBeUndefined();
  });
});
