import type {
  Asset,
  DataMeta,
  DataResult,
  HistoryRange,
  MarketDataProvider,
  PricePoint,
  Quote,
} from '../types';
import { seededRandom } from '../../random';
import { pctChange } from '../change';

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
  const rand = seededRandom(fnv1a(asset.ticker));
  let price = asset.class === 'index' ? 10000 : 100;
  return businessDays(now, POINTS).map((date) => {
    price = price * (1 + (rand() * 2 - 1) * DAILY_VOL);
    return { date, close: Math.round(price * 100) / 100 };
  });
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
            // Ruling R13: com 252 pontos, "ano" compara com o ponto mais antigo (251 atrás).
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
