import { z } from 'zod';
import { log } from '../../logger';
import { pctChange } from '../change';
import type {
  Asset,
  DataMeta,
  DataResult,
  Fundamentals,
  HistoryRange,
  MarketDataProvider,
  PricePoint,
  Quote,
  UnavailableReason,
} from '../types';

const ATTRIBUTION = 'brapi.dev';
export const PL_LOSS_REASON =
  'A empresa teve prejuízo nos últimos 12 meses; o P/L negativo não tem leitura útil.';
const RANGE: Record<HistoryRange, string> = { '1m': '1mo', '6m': '6mo', '1y': '1y' };

const num = z.number().nullish();
const resultSchema = z.object({
  regularMarketPrice: z.number().finite(),
  regularMarketChangePercent: num,
  regularMarketVolume: num,
  regularMarketDayHigh: num,
  regularMarketDayLow: num,
  fiftyTwoWeekHigh: num,
  fiftyTwoWeekLow: num,
  historicalDataPrice: z
    .array(z.object({ date: z.number(), close: z.number().nullish() }))
    .nullish(),
});
const bodySchema = z.object({ results: z.array(z.unknown()).min(1) });
const fundamentalsSchema = z.object({ priceEarnings: z.number().finite() });

type Result = z.infer<typeof resultSchema>;

function series(r: Result): PricePoint[] {
  const out: PricePoint[] = [];
  for (const p of r.historicalDataPrice ?? []) {
    if (typeof p.close !== 'number' || !Number.isFinite(p.close)) continue;
    out.push({ date: new Date(p.date * 1000).toISOString().slice(0, 10), close: p.close });
  }
  return out;
}

export function createBrapiProvider(opts: {
  token: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}): MarketDataProvider {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const now = opts.now ?? (() => new Date());
  const meta = (): DataMeta => ({
    source: 'brapi',
    isDemo: false,
    asOf: now().toISOString(),
    attribution: ATTRIBUTION,
  });

  function fail<T>(op: string, asset: Asset, reason: UnavailableReason): DataResult<T> {
    // Nunca inclua o token no log.
    log('warn', 'provider.unavailable', { provider: 'brapi', op, ticker: asset.ticker, reason });
    return { status: 'unavailable', reason, source: 'brapi', attribution: ATTRIBUTION };
  }

  /** Sem `range`: só a cotação (preço, dia, volume, 52 semanas). Com `range`: inclui o histórico. */
  async function load(
    asset: Asset,
    range?: string,
  ): Promise<{ ok: true; result: unknown } | { ok: false; reason: UnavailableReason }> {
    const symbol = encodeURIComponent(asset.brapiSymbol ?? asset.ticker);
    const base = `https://brapi.dev/api/quote/${symbol}`;
    const url = range ? `${base}?range=${range}&interval=1d` : base;
    let body: unknown;
    try {
      const res = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${opts.token}` },
        next: { revalidate: 900 },
        signal: AbortSignal.timeout(5000),
      } as RequestInit);
      if (!res.ok) return { ok: false, reason: 'fetch-failed' };
      body = await res.json();
    } catch {
      return { ok: false, reason: 'fetch-failed' };
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return { ok: false, reason: 'invalid-response' };
    return { ok: true, result: parsed.data.results[0] };
  }

  async function loadHistory(asset: Asset, range: HistoryRange): Promise<DataResult<PricePoint[]>> {
    const l = await load(asset, RANGE[range]);
    if (!l.ok) return fail('history', asset, l.reason);
    const r = resultSchema.safeParse(l.result);
    if (!r.success) return fail('history', asset, 'invalid-response');
    const points = series(r.data);
    if (points.length === 0) return fail('history', asset, 'empty');
    return { status: 'ok', data: points, meta: meta() };
  }

  return {
    id: 'brapi',
    async getQuote(asset): Promise<DataResult<Quote>> {
      // A cotação não depende do histórico: se a chamada de 1 ano falhar (ex.: plano sem esse
      // intervalo), semana/mês/ano ficam null e o resto da cotação continua valendo.
      const [l, h] = await Promise.all([load(asset), loadHistory(asset, '1y')]);
      if (!l.ok) return fail('quote', asset, l.reason);
      const r = resultSchema.safeParse(l.result);
      if (!r.success) return fail('quote', asset, 'invalid-response');
      const d = r.data;
      const closes = h.status === 'ok' ? h.data.map((p) => p.close) : [];
      const pct = d.regularMarketChangePercent;
      return {
        status: 'ok',
        data: {
          price: d.regularMarketPrice,
          change: {
            day: typeof pct === 'number' ? pct / 100 : null,
            week: pctChange(closes, 5),
            month: pctChange(closes, 21),
            // Mesma convenção do demo: "ano" compara com o ponto mais antigo.
            year: closes.length > 1 ? pctChange(closes, closes.length - 1) : null,
          },
          volume: d.regularMarketVolume ?? null,
          dayHigh: d.regularMarketDayHigh ?? null,
          dayLow: d.regularMarketDayLow ?? null,
          high52w: d.fiftyTwoWeekHigh ?? null,
          low52w: d.fiftyTwoWeekLow ?? null,
        },
        meta: meta(),
      };
    },
    getHistory: loadHistory,
    async getFundamentals(asset): Promise<DataResult<Fundamentals>> {
      const l = await load(asset);
      if (!l.ok) return fail('fundamentals', asset, l.reason);
      const r = fundamentalsSchema.safeParse(l.result);
      if (!r.success) return fail('fundamentals', asset, 'not-provided');
      // P/L negativo = prejuízo em 12 meses: calculável, mas sem significado (skill financial-analysis).
      const loss = r.data.priceEarnings < 0;
      return {
        status: 'ok',
        data: {
          pl: loss ? null : r.data.priceEarnings,
          pvp: null,
          roe: null,
          roic: null,
          netMargin: null,
          ebitdaMargin: null,
          netDebtToEbitda: null,
          dividendYield: null,
          payout: null,
          revenueCagr5y: null,
          earningsCagr5y: null,
          ...(loss ? { notApplicable: { pl: PL_LOSS_REASON } } : {}),
        },
        meta: meta(),
      };
    },
  };
}
