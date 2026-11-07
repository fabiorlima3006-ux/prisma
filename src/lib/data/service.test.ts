import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseEnv } from '../config/env';
import { getAsset } from './catalog';
import { createDemoProvider } from './providers/demo';
import { createMarketDataService } from './service';
import type { DataResult, IndicatorValue, MarketDataProvider } from './types';

const petr4 = getAsset('stock', 'petr4')!;
const btc = getAsset('crypto', 'btc')!;
const sp500 = getAsset('index', 'spx')!;

const okIndicator: DataResult<IndicatorValue> = {
  status: 'ok',
  data: { id: 'selic', value: 0.1, unit: 'a.a.', referenceDate: '2026-11-07' },
  meta: { source: 'bcb', isDemo: false, asOf: 'x', attribution: 'BCB' },
};
const fakeBcb: MarketDataProvider = { id: 'bcb', getIndicator: async () => okIndicator };
const failingBrapi: MarketDataProvider = {
  id: 'brapi',
  getQuote: async () => ({
    status: 'unavailable',
    reason: 'fetch-failed',
    source: 'brapi',
    attribution: 'brapi',
  }),
};

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('market data service', () => {
  const noToken = createMarketDataService({
    env: parseEnv({}),
    providers: { bcb: fakeBcb, demo: createDemoProvider() },
  });
  const withToken = createMarketDataService({
    env: parseEnv({ BRAPI_TOKEN: 't' }),
    providers: { bcb: fakeBcb, brapi: failingBrapi, demo: createDemoProvider() },
  });

  it('seleciona o provedor conforme token, mercado e classe', () => {
    expect(noToken.providerFor(petr4)).toBe('demo');
    expect(noToken.providerFor(btc)).toBe('demo');
    expect(withToken.providerFor(petr4)).toBe('brapi');
    expect(withToken.providerFor(sp500)).toBe('demo');
    expect(withToken.providerFor(btc)).toBe('demo');
  });

  it('indicadores sempre vêm do BCB', async () => {
    expect(await noToken.getIndicator('selic')).toBe(okIndicator);
  });

  it('falha do provedor real não vira demo', async () => {
    expect(await withToken.getQuote(petr4)).toMatchObject({
      status: 'unavailable',
      source: 'brapi',
    });
  });

  it('método ausente no provedor escolhido é not-provided, sem fallback', async () => {
    expect(await noToken.getFundamentals(petr4)).toMatchObject({
      status: 'unavailable',
      reason: 'not-provided',
    });
    expect(await withToken.getHistory(petr4, '1m')).toMatchObject({
      status: 'unavailable',
      reason: 'not-provided',
      source: 'brapi',
    });
  });

  it('demo atende cotação sem token', async () => {
    expect(await noToken.getQuote(petr4)).toMatchObject({ status: 'ok', meta: { isDemo: true } });
  });
});
