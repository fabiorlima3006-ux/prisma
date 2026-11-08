export type DataSource = 'bcb' | 'brapi' | 'demo';

export interface DataMeta {
  source: DataSource;
  isDemo: boolean;
  asOf: string;
  attribution: string;
}

export type UnavailableReason = 'fetch-failed' | 'invalid-response' | 'not-provided' | 'empty';

export type DataResult<T> =
  | { status: 'ok'; data: T; meta: DataMeta }
  | { status: 'unavailable'; reason: UnavailableReason; source: DataSource; attribution: string };

export type AssetClass = 'stock' | 'fii' | 'etf' | 'crypto' | 'index' | 'currency';

export interface Asset {
  ticker: string;
  slug: string;
  name: string;
  class: AssetClass;
  market: 'BR' | 'US' | 'CRYPTO';
  currency: 'BRL' | 'USD';
  brapiSymbol?: string;
}

export interface Quote {
  price: number;
  change: { day: number | null; week: number | null; month: number | null; year: number | null };
  volume: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  high52w: number | null;
  low52w: number | null;
}

export interface PricePoint {
  date: string;
  close: number;
}

export type HistoryRange = '1m' | '6m' | '1y';

export interface Fundamentals {
  pl: number | null;
  pvp: number | null;
  roe: number | null;
  roic: number | null;
  netMargin: number | null;
  ebitdaMargin: number | null;
  netDebtToEbitda: number | null;
  dividendYield: number | null;
  payout: number | null;
  revenueCagr5y: number | null;
  earningsCagr5y: number | null;
  /**
   * Indicadores calculáveis mas sem significado (ex.: P/L com prejuízo): o valor fica `null`
   * e a UI mostra "Não se aplica" com este motivo.
   */
  notApplicable?: Partial<Record<FundamentalKey, string>>;
}

export type FundamentalKey = Exclude<keyof Fundamentals, 'notApplicable'>;

export type IndicatorId = 'selic' | 'cdi' | 'ipca12m' | 'ipcaMonth' | 'ptax' | 'tr';

export interface IndicatorValue {
  id: IndicatorId;
  /** Fração para taxas (0,105 = 10,5%); BRL para ptax. */
  value: number;
  unit: 'a.a.' | 'a.m.' | 'BRL';
  /** YYYY-MM-DD */
  referenceDate: string;
}

export interface MonthlyPoint {
  /** YYYY-MM */
  month: string;
  /** Fração: 0,0042 = 0,42%. */
  value: number;
}

export interface MarketDataProvider {
  id: DataSource;
  getIndicator?(id: IndicatorId): Promise<DataResult<IndicatorValue>>;
  getIndicatorHistory?(id: 'ipcaMonth', fromMonth: string): Promise<DataResult<MonthlyPoint[]>>;
  getQuote?(asset: Asset): Promise<DataResult<Quote>>;
  getHistory?(asset: Asset, range: HistoryRange): Promise<DataResult<PricePoint[]>>;
  getFundamentals?(asset: Asset): Promise<DataResult<Fundamentals>>;
}
