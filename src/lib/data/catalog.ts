import type { Asset, AssetClass } from './types';

type Row = [ticker: string, name: string, brapiSymbol?: string];

function br(cls: AssetClass, rows: Row[]): Asset[] {
  return rows.map(([ticker, name]) => ({
    ticker,
    slug: ticker.toLowerCase(),
    name,
    class: cls,
    market: 'BR',
    currency: 'BRL',
    brapiSymbol: ticker,
  }));
}

function us(ticker: string, name: string): Asset {
  return {
    ticker,
    slug: ticker.toLowerCase(),
    name,
    class: 'index',
    market: 'US',
    currency: 'USD',
  };
}

export const CATALOG: readonly Asset[] = [
  ...br('stock', [
    ['PETR4', 'Petrobras PN'],
    ['VALE3', 'Vale ON'],
    ['ITUB4', 'Itaú Unibanco PN'],
    ['WEGE3', 'WEG ON'],
    ['BBAS3', 'Banco do Brasil ON'],
  ]),
  ...br('fii', [
    ['MXRF11', 'Maxi Renda'],
    ['HGLG11', 'CSHG Logística'],
    ['KNRI11', 'Kinea Renda Imobiliária'],
  ]),
  ...br('etf', [
    ['BOVA11', 'iShares Ibovespa'],
    ['IVVB11', 'iShares S&P 500 em reais'],
  ]),
  {
    ticker: 'BTC',
    slug: 'btc',
    name: 'Bitcoin',
    class: 'crypto',
    market: 'CRYPTO',
    currency: 'USD',
    brapiSymbol: 'BTC',
  },
  {
    ticker: 'ETH',
    slug: 'eth',
    name: 'Ethereum',
    class: 'crypto',
    market: 'CRYPTO',
    currency: 'USD',
    brapiSymbol: 'ETH',
  },
  {
    ticker: 'IBOV',
    slug: 'ibov',
    name: 'Ibovespa',
    class: 'index',
    market: 'BR',
    currency: 'BRL',
    brapiSymbol: '^BVSP',
  },
  us('SPX', 'S&P 500'),
  us('NDX', 'Nasdaq 100'),
  us('DJI', 'Dow Jones'),
  {
    ticker: 'USDBRL',
    slug: 'usdbrl',
    name: 'Dólar comercial PTAX',
    class: 'currency',
    market: 'BR',
    currency: 'BRL',
  },
];

export const CLASS_ROUTES: Record<'acoes' | 'fiis' | 'etfs' | 'cripto', AssetClass> = {
  acoes: 'stock',
  fiis: 'fii',
  etfs: 'etf',
  cripto: 'crypto',
};

export function getAsset(assetClass: AssetClass, slug: string): Asset | undefined {
  return CATALOG.find((a) => a.class === assetClass && a.slug === slug);
}

export function listByClass(assetClass: AssetClass): Asset[] {
  return CATALOG.filter((a) => a.class === assetClass);
}
