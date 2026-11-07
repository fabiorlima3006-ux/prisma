import type {
  Asset,
  DataMeta,
  DataResult,
  HistoryRange,
  MarketDataProvider,
  PricePoint,
  Quote,
} from '../types';

const POINTS = 252;
const DAILY_VOL = 0.015;
const RANGE_POINTS: Record<HistoryRange, number> = { '1m': 21, '6m': 126, '1y': 252 };

function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Últimos `count` dias úteis (sem sábado/domingo) até a data de `now`, em ordem crescente. */
function businessDays(now: Date, count: number): string[] {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const out: string[] = [];
  while (out.length < count) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out.reverse();
}

function generate(asset: Asset, now: Date): PricePoint[] {
  const rand = mulberry32(fnv1a(asset.ticker));
  let price = asset.class === 'index' ? 10000 : 100;
  return businessDays(now, POINTS).map((date) => {
    price = price * (1 + (rand() * 2 - 1) * DAILY_VOL);
    return { date, close: Math.round(price * 100) / 100 };
  });
}

function pctChange(closes: number[], back: number): number | null {
  const last = closes[closes.length - 1];
  const ref = closes[closes.length - 1 - back];
  if (last === undefined || ref === undefined || ref === 0) return null;
  return last / ref - 1;
}

export function createDemoProvider(opts: { now?: () => Date } = {}): MarketDataProvider {
  const now = opts.now ?? (() => new Date());
  const meta = (): DataMeta => ({
    source: 'demo',
    isDemo: true,
    asOf: now().toISOString(),
    attribution: 'Dados demonstrativos gerados pela plataforma',
  });

  return {
    id: 'demo',
    async getHistory(asset, range): Promise<DataResult<PricePoint[]>> {
      const all = generate(asset, now());
      return { status: 'ok', data: all.slice(-RANGE_POINTS[range]), meta: meta() };
    },
    async getQuote(asset): Promise<DataResult<Quote>> {
      const closes = generate(asset, now()).map((p) => p.close);
      const price = closes[closes.length - 1];
      if (price === undefined) {
        return {
          status: 'unavailable',
          reason: 'empty',
          source: 'demo',
          attribution: meta().attribution,
        };
      }
      return {
        status: 'ok',
        data: {
          price,
          change: {
            day: pctChange(closes, 1),
            week: pctChange(closes, 5),
            month: pctChange(closes, 21),
            year: pctChange(closes, 251),
          },
          volume: null,
          dayHigh: null,
          dayLow: null,
          high52w: Math.max(...closes),
          low52w: Math.min(...closes),
        },
        meta: meta(),
      };
    },
  };
}
