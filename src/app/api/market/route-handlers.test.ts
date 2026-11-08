import { beforeEach, describe, expect, it, vi } from 'vitest';

const okQuote = {
  status: 'ok',
  data: { price: 1 },
  meta: { source: 'demo', isDemo: true, asOf: 'x', attribution: 'x' },
};
const mocks = vi.hoisted(() => ({
  getQuote: vi.fn(),
  getHistory: vi.fn(),
  getIndicator: vi.fn(),
}));
vi.mock('@/lib/data', () => ({ marketData: mocks }));

import { GET as historyGET } from './history/[ticker]/route';
import { GET as indicatorsGET } from './indicators/route';
import { GET as quoteGET } from './quote/[ticker]/route';

// O limitador é um singleton do módulo; cada teste usa um IP diferente em vez de resetá-lo.
let n = 0;
let ip = '';
const req = (path: string) =>
  new Request(`http://localhost${path}`, { headers: { 'x-forwarded-for': ip } });
const ctx = (ticker: string) => ({ params: Promise.resolve({ ticker }) });

beforeEach(() => {
  n += 1;
  ip = `10.0.0.${n}`;
  mocks.getQuote.mockReset().mockResolvedValue(okQuote);
  mocks.getHistory.mockReset().mockResolvedValue({ ...okQuote, data: [] });
  mocks.getIndicator
    .mockReset()
    .mockImplementation(async (id: string) => ({ ...okQuote, data: { id } }));
});

describe('quote', () => {
  it('400 para formato inválido', async () => {
    const res = await quoteGET(req('/api/market/quote/%3Cscript%3E'), ctx('<script>'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid-ticker' });
  });
  it('404 fora do catálogo', async () => {
    const res = await quoteGET(req('/api/market/quote/zzzz9'), ctx('zzzz9'));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not-found' });
  });
  it('404 para classes sem página: câmbio (usdbrl) e índices (ibov)', async () => {
    for (const t of ['usdbrl', 'USDBRL', 'ibov', 'spx']) {
      const res = await quoteGET(req(`/api/market/quote/${t}`), ctx(t));
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'not-found' });
    }
    expect(mocks.getQuote).not.toHaveBeenCalled();
  });
  it('200 com ticker em minúsculas e cache', async () => {
    const res = await quoteGET(req('/api/market/quote/petr4'), ctx('petr4'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=900, stale-while-revalidate=3600',
    );
    expect(mocks.getQuote.mock.calls[0]![0].ticker).toBe('PETR4');
  });
  it('500 sem stack quando o serviço lança', async () => {
    mocks.getQuote.mockRejectedValue(new Error('boom'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await quoteGET(req('/api/market/quote/petr4'), ctx('petr4'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'internal' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it('429 com Retry-After após 60 requisições', async () => {
    for (let i = 0; i < 60; i++) {
      expect((await quoteGET(req('/q'), ctx('petr4'))).status).toBe(200);
    }
    const res = await quoteGET(req('/q'), ctx('petr4'));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(await res.json()).toEqual({ error: 'rate-limited' });
  });
});

describe('history', () => {
  it('400 para range inválido', async () => {
    const res = await historyGET(req('/api/market/history/petr4?range=5y'), ctx('petr4'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid-range' });
  });
  it('404 e 200', async () => {
    expect((await historyGET(req('/h?range=1m'), ctx('zzzz9'))).status).toBe(404);
    expect((await historyGET(req('/h?range=1m'), ctx('usdbrl'))).status).toBe(404);
    const res = await historyGET(req('/h?range=6m'), ctx('PETR4'));
    expect(res.status).toBe(200);
    expect(mocks.getHistory.mock.calls[0]![1]).toBe('6m');
  });
  it('usa 1y por padrão', async () => {
    await historyGET(req('/h'), ctx('petr4'));
    expect(mocks.getHistory.mock.calls[0]![1]).toBe('1y');
  });
});

describe('indicators', () => {
  it('retorna objeto por IndicatorId', async () => {
    const res = await indicatorsGET(req('/api/market/indicators'));
    expect(res.status).toBe(200);
    expect(Object.keys(await res.json()).sort()).toEqual([
      'cdi',
      'ipca12m',
      'ipcaMonth',
      'ptax',
      'selic',
      'tr',
    ]);
  });
});
