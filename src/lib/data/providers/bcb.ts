import { z } from 'zod';
import { log } from '../../logger';
import type {
  DataResult,
  IndicatorId,
  IndicatorValue,
  MarketDataProvider,
  UnavailableReason,
} from '../types';

const ATTRIBUTION = 'Banco Central do Brasil — SGS';

/**
 * Códigos verificados contra a API ao vivo (2026-11-07).
 * 432 meta Selic; 4389 CDI anualizado base 252; 433 IPCA var. mensal; 13522 IPCA acum. 12 meses;
 * 1 dólar venda (confere com a PTAX venda); 226 TR — taxa mensal com janela [data, dataFim],
 * publicada diariamente, portanto a.m.
 */
export const BCB_SERIES: Record<IndicatorId, { code: number; unit: IndicatorValue['unit'] }> = {
  selic: { code: 432, unit: 'a.a.' },
  cdi: { code: 4389, unit: 'a.a.' },
  ipcaMonth: { code: 433, unit: 'a.m.' },
  ipca12m: { code: 13522, unit: 'a.a.' },
  ptax: { code: 1, unit: 'BRL' },
  tr: { code: 226, unit: 'a.m.' },
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

  function fail(id: IndicatorId, reason: UnavailableReason): DataResult<IndicatorValue> {
    log('warn', 'provider.unavailable', { provider: 'bcb', id, reason });
    return { status: 'unavailable', reason, source: 'bcb', attribution: ATTRIBUTION };
  }

  return {
    id: 'bcb',
    async getIndicator(id): Promise<DataResult<IndicatorValue>> {
      const { code, unit } = BCB_SERIES[id];
      // Datas em UTC (calendário UTC de now()), de forma consistente em todo o provedor.
      const today = now();
      const todayIso = today.toISOString().slice(0, 10);
      // Selic (432) é a meta com data de vigência: ultimos/1 pode vir datado no futuro.
      // Consulta por período e usa a última linha com data <= hoje (Ruling R12).
      const base = `${baseUrl}/dados/serie/bcdata.sgs.${code}/dados`;
      const from = brDate(new Date(today.getTime() - 30 * 86400000));
      const url =
        id === 'selic'
          ? `${base}?formato=json&dataInicial=${from}&dataFinal=${brDate(today)}`
          : `${base}/ultimos/1?formato=json`;
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
      const rows =
        id === 'selic'
          ? parsed.data.filter((r) => {
              const d = parseDate(r.data);
              return d !== null && d <= todayIso;
            })
          : parsed.data;
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
