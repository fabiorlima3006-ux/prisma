import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fixture from './__fixtures__/brapi-petr4.json';
import { createBrapiProvider, PL_LOSS_REASON } from './brapi';
import { getAsset } from '../catalog';

const petr4 = getAsset('stock', 'petr4')!;
const now = () => new Date('2026-11-07T12:00:00Z');

function fakeFetch(body: unknown, ok = true) {
  return vi.fn(
    async () => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response,
  ) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('brapi provider', () => {
  it('mapeia a cotação da fixture real, com variações em fração', async () => {
    const f = fakeFetch(fixture);
    const q = await createBrapiProvider({ token: 't', fetchImpl: f, now }).getQuote!(petr4);
    expect(q).toMatchObject({ status: 'ok', meta: { source: 'brapi', isDemo: false } });
    if (q.status !== 'ok') throw new Error('esperava ok');
    const r = fixture.results[0]!;
    expect(q.data.price).toBe(r.regularMarketPrice);
    expect(q.data.change.day).toBeCloseTo(r.regularMarketChangePercent / 100, 10);
    expect(q.data.volume).toBe(r.regularMarketVolume);
    expect(q.data.high52w).toBe(r.fiftyTwoWeekHigh);
    expect(q.data.low52w).toBe(r.fiftyTwoWeekLow);
    expect(q.data.dayHigh).toBe(r.regularMarketDayHigh);
    // 20 pontos: semana (5 atrás) existe; mês (21 atrás) não; ano usa o mais antigo.
    const closes = r.historicalDataPrice.map((p) => p.close);
    expect(q.data.change.week).toBeCloseTo(closes[19]! / closes[14]! - 1, 10);
    expect(q.data.change.month).toBeNull();
    expect(q.data.change.year).toBeCloseTo(closes[19]! / closes[0]! - 1, 10);
    expect(f).toHaveBeenCalledWith(
      'https://brapi.dev/api/quote/PETR4',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer t' }),
      }),
    );
    // Semana/mês/ano vêm de uma chamada de histórico separada.
    expect(f).toHaveBeenCalledWith(
      'https://brapi.dev/api/quote/PETR4?range=1y&interval=1d',
      expect.anything(),
    );
  });

  it('histórico falha: cotação continua ok, com semana/mês/ano null', async () => {
    const { historicalDataPrice: _h, ...quoteOnly } = fixture.results[0]!;
    void _h;
    const f = vi.fn(async (url: string) =>
      url.includes('range=')
        ? ({ ok: false, status: 400, json: async () => ({}) } as Response)
        : ({ ok: true, status: 200, json: async () => ({ results: [quoteOnly] }) } as Response),
    ) as unknown as typeof fetch;
    const q = await createBrapiProvider({ token: 't', fetchImpl: f, now }).getQuote!(petr4);
    if (q.status !== 'ok') throw new Error('esperava ok');
    expect(q.data.price).toBe(quoteOnly.regularMarketPrice);
    expect(q.data.change.day).toBeCloseTo(quoteOnly.regularMarketChangePercent / 100, 10);
    expect(q.data.high52w).toBe(quoteOnly.fiftyTwoWeekHigh);
    expect(q.data.change).toMatchObject({ week: null, month: null, year: null });
  });

  it('P/L negativo (prejuízo) vira "não se aplica" com motivo', async () => {
    const body = { results: [{ ...fixture.results[0]!, priceEarnings: -3.2 }] };
    const p = createBrapiProvider({ token: 't', fetchImpl: fakeFetch(body), now });
    const fd = await p.getFundamentals!(petr4);
    if (fd.status !== 'ok') throw new Error('esperava ok');
    expect(fd.data.pl).toBeNull();
    expect(fd.data.notApplicable?.pl).toBe(PL_LOSS_REASON);
    expect(PL_LOSS_REASON).toMatch(/prejuízo nos últimos 12 meses/);
  });

  it('mapeia o histórico com datas YYYY-MM-DD e o intervalo pedido', async () => {
    const f = fakeFetch(fixture);
    const h = await createBrapiProvider({ token: 't', fetchImpl: f, now }).getHistory!(petr4, '6m');
    expect(f).toHaveBeenCalledWith(expect.stringContaining('range=6mo'), expect.anything());
    expect(f).toHaveBeenCalledWith(expect.stringContaining('interval=1d'), expect.anything());
    if (h.status !== 'ok') throw new Error('esperava ok');
    expect(h.data).toHaveLength(20);
    expect(h.data[0]).toEqual({ date: '2026-10-08', close: 55.48 });
  });

  it('resposta sem preço é invalid-response', async () => {
    const p = createBrapiProvider({ token: 't', fetchImpl: fakeFetch({ results: [{}] }), now });
    expect(await p.getQuote!(petr4)).toMatchObject({
      status: 'unavailable',
      reason: 'invalid-response',
      source: 'brapi',
    });
  });

  it('HTTP não ok ou exceção é fetch-failed', async () => {
    const bad = createBrapiProvider({ token: 't', fetchImpl: fakeFetch({}, false), now });
    expect(await bad.getQuote!(petr4)).toMatchObject({ reason: 'fetch-failed' });
    const boom = createBrapiProvider({
      token: 't',
      fetchImpl: (async () => {
        throw new Error('rede');
      }) as unknown as typeof fetch,
      now,
    });
    expect(await boom.getHistory!(petr4, '1m')).toMatchObject({ reason: 'fetch-failed' });
  });

  it('fundamentos: só o que a resposta traz; senão not-provided', async () => {
    const p = createBrapiProvider({ token: 't', fetchImpl: fakeFetch(fixture), now });
    const f = await p.getFundamentals!(petr4);
    if (f.status !== 'ok') throw new Error('esperava ok');
    expect(f.data.pl).toBe(fixture.results[0]!.priceEarnings);
    expect(f.data.notApplicable).toBeUndefined();
    expect(f.data.roe).toBeNull();
    expect(f.data.dividendYield).toBeNull();
    const none = createBrapiProvider({
      token: 't',
      fetchImpl: fakeFetch({ results: [{ regularMarketPrice: 1 }] }),
      now,
    });
    expect(await none.getFundamentals!(petr4)).toMatchObject({
      status: 'unavailable',
      reason: 'not-provided',
    });
  });

  it('nunca registra o token', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = createBrapiProvider({ token: 'SEGREDO123', fetchImpl: fakeFetch({}, false), now });
    await p.getQuote!(petr4);
    expect(JSON.stringify(warn.mock.calls)).not.toContain('SEGREDO123');
  });
});
