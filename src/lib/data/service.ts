import type { Env } from '../config/env';
import type {
  Asset,
  DataResult,
  DataSource,
  Fundamentals,
  HistoryRange,
  IndicatorId,
  IndicatorValue,
  MarketDataProvider,
  PricePoint,
  Quote,
} from './types';

export type MarketDataService = {
  getIndicator(id: IndicatorId): Promise<DataResult<IndicatorValue>>;
  getQuote(a: Asset): Promise<DataResult<Quote>>;
  getHistory(a: Asset, r: HistoryRange): Promise<DataResult<PricePoint[]>>;
  getFundamentals(a: Asset): Promise<DataResult<Fundamentals>>;
  providerFor(a: Asset): DataSource;
};

const BRAPI_CLASSES: readonly Asset['class'][] = ['stock', 'fii', 'etf', 'index'];

export function createMarketDataService(cfg: {
  env: Env;
  providers?: Partial<Record<DataSource, MarketDataProvider>>;
}): MarketDataService {
  const providers = cfg.providers ?? {};

  function providerFor(a: Asset): DataSource {
    if (cfg.env.BRAPI_TOKEN && a.market === 'BR' && BRAPI_CLASSES.includes(a.class)) return 'brapi';
    return 'demo';
  }

  function notProvided<T>(source: DataSource): DataResult<T> {
    return { status: 'unavailable', reason: 'not-provided', source, attribution: source };
  }

  return {
    providerFor,
    async getIndicator(id) {
      const p = providers.bcb;
      return p?.getIndicator ? p.getIndicator(id) : notProvided('bcb');
    },
    async getQuote(a) {
      const s = providerFor(a);
      const p = providers[s];
      return p?.getQuote ? p.getQuote(a) : notProvided(s);
    },
    async getHistory(a, r) {
      const s = providerFor(a);
      const p = providers[s];
      return p?.getHistory ? p.getHistory(a, r) : notProvided(s);
    },
    async getFundamentals(a) {
      const s = providerFor(a);
      const p = providers[s];
      return p?.getFundamentals ? p.getFundamentals(a) : notProvided(s);
    },
  };
}
