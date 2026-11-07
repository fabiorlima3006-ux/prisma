/** Converte taxa anual (fração) em taxa mensal equivalente: (1+a)^(1/12) − 1. */
export function annualToMonthly(annual: number): number {
  return Math.pow(1 + annual, 1 / 12) - 1;
}

/** Converte taxa mensal (fração) em taxa anual equivalente: (1+m)^12 − 1. */
export function monthlyToAnnual(monthly: number): number {
  return Math.pow(1 + monthly, 12) - 1;
}
