import type { IndicatorId, IndicatorValue } from '@/lib/data/types';
import { formatDate, formatMonthYear } from '@/lib/format';

export const INDICATOR_LABELS: Record<IndicatorId, string> = {
  selic: 'Selic',
  cdi: 'CDI',
  ipca12m: 'IPCA 12m',
  ipcaMonth: 'IPCA mês',
  ptax: 'Dólar PTAX',
  tr: 'TR',
};

const MONTHLY: ReadonlySet<IndicatorId> = new Set(['ipca12m', 'ipcaMonth']);

/** Data de referência do indicador: IPCA é mensal ("ref. MM/aaaa"); os demais, diários. */
export function referenceLabel(v: Pick<IndicatorValue, 'id' | 'referenceDate'>): string {
  const date = MONTHLY.has(v.id) ? formatMonthYear(v.referenceDate) : formatDate(v.referenceDate);
  return `ref. ${date}`;
}
