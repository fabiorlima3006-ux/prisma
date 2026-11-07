import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import selic from './__fixtures__/bcb-selic.json';
import cdi from './__fixtures__/bcb-cdi.json';
import ipcaMonth from './__fixtures__/bcb-ipcaMonth.json';
import ipca12m from './__fixtures__/bcb-ipca12m.json';
import ptax from './__fixtures__/bcb-ptax.json';
import tr from './__fixtures__/bcb-tr.json';
import { BCB_SERIES, createBcbProvider } from './bcb';

function fakeFetch(body: unknown, ok = true): typeof fetch {
  return (async () =>
    ({
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
    }) as Response) as unknown as typeof fetch;
}

const fixtures = { selic, cdi, ipcaMonth, ipca12m, ptax, tr } as const;
const now = () => new Date('2026-11-07T12:00:00Z');

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('bcb provider', () => {
  it('converte Selic de % para fração', async () => {
    const p = createBcbProvider({ baseUrl: 'https://x', fetchImpl: fakeFetch(selic), now });
    const r = await p.getIndicator!('selic');
    expect(r).toMatchObject({
      status: 'ok',
      meta: { source: 'bcb', isDemo: false, attribution: 'Banco Central do Brasil — SGS' },
    });
    if (r.status !== 'ok') throw new Error('esperava ok');
    expect(r.data.value).toBeCloseTo(Number(selic.at(-1)!.valor) / 100, 10);
    expect(r.data.unit).toBe('a.a.');
    expect(r.data.referenceDate).toBe('2026-11-07');
    expect(r.meta.asOf).toBe('2026-11-07T12:00:00.000Z');
  });

  it.each(Object.keys(fixtures) as (keyof typeof fixtures)[])('lê a fixture de %s', async (id) => {
    const p = createBcbProvider({ baseUrl: 'https://x', fetchImpl: fakeFetch(fixtures[id]) });
    const r = await p.getIndicator!(id);
    if (r.status !== 'ok') throw new Error('esperava ok');
    const raw = Number(fixtures[id].at(-1)!.valor);
    expect(r.data.id).toBe(id);
    expect(r.data.unit).toBe(BCB_SERIES[id].unit);
    expect(r.data.value).toBeCloseTo(id === 'ptax' ? raw : raw / 100, 10);
  });

  it('monta a URL da série e repassa cache e timeout', async () => {
    const spy = vi.fn(fakeFetch(cdi));
    await createBcbProvider({ baseUrl: 'https://x', fetchImpl: spy }).getIndicator!('cdi');
    expect(spy.mock.calls[0]![0]).toBe(
      'https://x/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json',
    );
    expect(spy.mock.calls[0]![1]).toMatchObject({
      next: { revalidate: 3600 },
      signal: expect.any(AbortSignal),
    });
  });

  it('Selic consulta por período (últimos 30 dias até hoje)', async () => {
    const spy = vi.fn(fakeFetch(selic));
    await createBcbProvider({ baseUrl: 'https://x', fetchImpl: spy, now }).getIndicator!('selic');
    expect(spy.mock.calls[0]![0]).toBe(
      'https://x/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial=08/10/2026&dataFinal=07/11/2026',
    );
  });

  it('Selic ignora linhas com data futura e usa a última até hoje', async () => {
    const body = [
      { data: '06/11/2026', valor: '13.65' },
      { data: '07/11/2026', valor: '13.75' },
      { data: '09/12/2026', valor: '14.00' },
    ];
    const p = createBcbProvider({ baseUrl: 'https://x', fetchImpl: fakeFetch(body), now });
    const r = await p.getIndicator!('selic');
    if (r.status !== 'ok') throw new Error('esperava ok');
    expect(r.data.referenceDate).toBe('2026-11-07');
    expect(r.data.value).toBeCloseTo(0.1375, 10);
  });

  it('Selic só com datas futuras é empty', async () => {
    const body = [{ data: '09/12/2026', valor: '14.00' }];
    const p = createBcbProvider({ baseUrl: 'https://x', fetchImpl: fakeFetch(body), now });
    expect(await p.getIndicator!('selic')).toMatchObject({
      status: 'unavailable',
      reason: 'empty',
    });
  });

  it('array vazio é unavailable/empty', async () => {
    const p = createBcbProvider({ baseUrl: 'https://x', fetchImpl: fakeFetch([]) });
    expect(await p.getIndicator!('selic')).toMatchObject({
      status: 'unavailable',
      reason: 'empty',
    });
  });

  it('valor vazio é invalid-response', async () => {
    const p = createBcbProvider({
      baseUrl: 'https://x',
      fetchImpl: fakeFetch([{ data: '07/11/2026', valor: '' }]),
    });
    expect(await p.getIndicator!('selic')).toMatchObject({
      status: 'unavailable',
      reason: 'invalid-response',
    });
  });

  it('forma inesperada e data inválida são invalid-response', async () => {
    const a = createBcbProvider({ baseUrl: 'https://x', fetchImpl: fakeFetch({ erro: 1 }) });
    expect(await a.getIndicator!('selic')).toMatchObject({ reason: 'invalid-response' });
    const b = createBcbProvider({
      baseUrl: 'https://x',
      fetchImpl: fakeFetch([{ data: 'ontem', valor: '1' }]),
    });
    expect(await b.getIndicator!('selic')).toMatchObject({ reason: 'invalid-response' });
  });

  it('rede fora do ar e HTTP erro são fetch-failed', async () => {
    const down = createBcbProvider({
      baseUrl: 'https://x',
      fetchImpl: () => Promise.reject(new Error('down')),
    });
    expect(await down.getIndicator!('selic')).toMatchObject({
      status: 'unavailable',
      reason: 'fetch-failed',
      source: 'bcb',
    });
    const http = createBcbProvider({ baseUrl: 'https://x', fetchImpl: fakeFetch([], false) });
    expect(await http.getIndicator!('selic')).toMatchObject({ reason: 'fetch-failed' });
  });

  it('registra aviso em falhas', async () => {
    await createBcbProvider({ baseUrl: 'https://x', fetchImpl: fakeFetch([]) }).getIndicator!(
      'cdi',
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(vi.mocked(console.warn).mock.calls[0]![0]));
    expect(line).toMatchObject({
      level: 'warn',
      event: 'provider.unavailable',
      provider: 'bcb',
      id: 'cdi',
      reason: 'empty',
    });
  });

  it.skip('@live consulta a API real', async () => {
    const p = createBcbProvider({ baseUrl: 'https://api.bcb.gov.br' });
    for (const id of Object.keys(BCB_SERIES) as (keyof typeof BCB_SERIES)[]) {
      const r = await p.getIndicator!(id);
      expect(r.status).toBe('ok');
    }
  });
});
