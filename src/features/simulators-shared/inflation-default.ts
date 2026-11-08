import { referenceLabel } from '@/components/market/indicator-labels';
import type { DataResult, IndicatorValue } from '@/lib/data/types';
import { formatNumber } from '@/lib/format';

/** Nota exibida sob o campo de inflação quando não há IPCA real para sugerir. */
export const INFLATION_UNAVAILABLE_NOTE =
  'IPCA indisponível no momento; informe uma premissa se quiser ver o valor em reais de hoje';

/**
 * Padrão do campo de inflação: o IPCA acumulado em 12 meses (dado real do BCB), em % pt-BR,
 * com a nota de fonte e referência. Sem dado real, devolve null: nunca há valor demonstrativo.
 */
export function inflationDefault(
  result: DataResult<IndicatorValue>,
): { percent: string; note: string } | null {
  if (result.status !== 'ok') return null;
  return {
    percent: formatNumber(result.data.value * 100, 2),
    note: `IPCA 12 meses, ${referenceLabel(result.data)} (premissa, não previsão)`,
  };
}
