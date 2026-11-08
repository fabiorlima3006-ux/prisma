import { z } from 'zod';
import { log } from '../../logger';
import type {
  DataResult,
  IndicatorId,
  IndicatorValue,
  MarketDataProvider,
  MonthlyPoint,
  UnavailableReason,
} from '../types';

const ATTRIBUTION = 'Banco Central do Brasil — SGS';

/**
 * Códigos verificados contra a API ao vivo (2026-11-07).
 * 432 meta Selic; 4389 CDI anualizado base 252; 433 IPCA var. mensal; 13522 IPCA acum. 12 meses;
 * 1 dólar venda (confere com a PTAX venda); 226 TR — taxa mensal com janela [data, dataFim],
 * publicada diariamente, portanto a.m.
 */
export const BCB_SERIES: Record<
  IndicatorId,
  { code: number; unit: IndicatorValue['unit']; windowDays: number }
> = {
  selic: { code: 432, unit: 'a.a.', windowDays: 30 },
  cdi: { code: 4389, unit: 'a.a.', windowDays: 30 },
  // Mensais: o IPCA sai cerca de 40 dias depois do mês de referência.
  ipcaMonth: { code: 433, unit: 'a.m.', windowDays: 180 },
  ipca12m: { code: 13522, unit: 'a.a.', windowDays: 180 },
  ptax: { code: 1, unit: 'BRL', windowDays: 30 },
  tr: { code: 226, unit: 'a.m.', windowDays: 30 },
};

const responseSchema = z.array(z.object({ data: z.string(), valor: z.string() }));

function parseDate(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function brDate(d: Date): string {
  const iso = d.toISOString().slice(0, 10);
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

export function createBcbProvider(opts: {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}): MarketDataProvider {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const now = opts.now ?? (() => new Date());
  const baseUrl = opts.baseUrl.replace(/\/+$/, '');

  function fail<T = IndicatorValue>(id: IndicatorId, reason: UnavailableReason): DataResult<T> {
    log('warn', 'provider.unavailable', { provider: 'bcb', id, reason });
    return { status: 'unavailable', reason, source: 'bcb', attribution: ATTRIBUTION };
  }

  // Blocos de no máximo 10 anos (limite da API do SGS para séries diárias; mantido por segurança),
  // a partir do dia 1 de fromMonth; o último termina hoje. Datas em UTC.
  function historyBlocks(fromMonth: string, today: Date): { from: string; to: string }[] | null {
    const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(fromMonth);
    if (!m) return null;
    const blocks: { from: string; to: string }[] = [];
    const todayMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    let start = Date.UTC(Number(m[1]), Number(m[2]) - 1, 1);
    while (start <= todayMs) {
      const s = new Date(start);
      const nextStart = Date.UTC(s.getUTCFullYear() + 10, s.getUTCMonth(), 1);
      const end = Math.min(nextStart - 86400000, todayMs);
      blocks.push({ from: brDate(s), to: brDate(new Date(end)) });
      start = nextStart;
    }
    return blocks;
  }

  return {
    id: 'bcb',
    async getIndicatorHistory(id, fromMonth): Promise<DataResult<MonthlyPoint[]>> {
      const today = now();
      const blocks = historyBlocks(fromMonth, today);
      if (!blocks || blocks.length === 0) return fail(id, 'invalid-response');
      const { code } = BCB_SERIES[id];
      const bodies: unknown[] = [];
      try {
        const results = await Promise.all(
          blocks.map(async (b) => {
            const url = `${baseUrl}/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${b.from}&dataFinal=${b.to}`;
            const res = await fetchImpl(url, {
              next: { revalidate: 86400 },
              signal: AbortSignal.timeout(10000),
            } as RequestInit);
            if (!res.ok) throw new Error('http');
            return res.json() as Promise<unknown>;
          }),
        );
        bodies.push(...results);
      } catch {
        return fail(id, 'fetch-failed');
      }

      const points: MonthlyPoint[] = [];
      const seen = new Set<string>();
      for (const body of bodies) {
        const parsed = responseSchema.safeParse(body);
        if (!parsed.success) return fail(id, 'invalid-response');
        for (const row of parsed.data) {
          const iso = parseDate(row.data);
          const raw = row.valor.trim();
          const num = raw === '' ? Number.NaN : Number(raw);
          if (iso === null || !Number.isFinite(num)) return fail(id, 'invalid-response');
          const month = iso.slice(0, 7);
          if (seen.has(month)) continue;
          seen.add(month);
          points.push({ month, value: num / 100 });
        }
      }
      if (points.length === 0) return fail(id, 'empty');
      points.sort((a, b) => (a.month < b.month ? -1 : 1));
      return {
        status: 'ok',
        data: points,
        meta: { source: 'bcb', isDemo: false, asOf: now().toISOString(), attribution: ATTRIBUTION },
      };
    },
    async getIndicator(id): Promise<DataResult<IndicatorValue>> {
      const { code, unit, windowDays } = BCB_SERIES[id];
      // Datas em UTC (calendário UTC de now()), de forma consistente em todo o provedor.
      const today = now();
      const todayIso = today.toISOString().slice(0, 10);
      // Sempre por período, nunca /ultimos/1: na Selic (432) esse atalho pode vir com vigência
      // futura (Ruling R12) e, em 2026-11-08, no CDI (4389) respondia 304 sem corpo (R34).
      // Usa a última linha com data <= hoje.
      const from = brDate(new Date(today.getTime() - windowDays * 86400000));
      const url = `${baseUrl}/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${from}&dataFinal=${brDate(today)}`;
      let body: unknown;
      try {
        const res = await fetchImpl(url, {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(5000),
        } as RequestInit);
        if (!res.ok) return fail(id, 'fetch-failed');
        body = await res.json();
      } catch {
        return fail(id, 'fetch-failed');
      }

      const parsed = responseSchema.safeParse(body);
      if (!parsed.success) return fail(id, 'invalid-response');
      if (parsed.data.some((r) => parseDate(r.data) === null)) return fail(id, 'invalid-response');
      const rows = parsed.data.filter((r) => {
        const d = parseDate(r.data);
        return d !== null && d <= todayIso;
      });
      const last = rows[rows.length - 1];
      if (!last) return fail(id, 'empty');

      const raw = last.valor.trim();
      const num = raw === '' ? Number.NaN : Number(raw);
      const referenceDate = parseDate(last.data);
      if (!Number.isFinite(num) || referenceDate === null) return fail(id, 'invalid-response');

      return {
        status: 'ok',
        data: { id, value: unit === 'BRL' ? num : num / 100, unit, referenceDate },
        meta: { source: 'bcb', isDemo: false, asOf: now().toISOString(), attribution: ATTRIBUTION },
      };
    },
  };
}
