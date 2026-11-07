import { formatNumber } from './number';

export function formatPercent(
  fraction: number,
  opts: { decimals?: number; signed?: boolean } = {},
): string {
  const { decimals = 2, signed = false } = opts;
  let pct = fraction * 100;
  // Evita "-0,00%": valores que arredondam para zero perdem o sinal.
  if (Number(pct.toFixed(decimals)) === 0) pct = 0;
  const body = `${formatNumber(pct, decimals)}%`;
  return signed && pct > 0 ? `+${body}` : body;
}
