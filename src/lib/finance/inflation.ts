import type { MonthlyPoint } from '@/lib/data/types';

/** Primeiro mês da série de IPCA usada nas correções (YYYY-MM). */
export const REAL_START_MONTH = '1994-07';
/** Limites aceitos para inflação anual (fração): −50% a 100%. */
export const INFLATION_MIN = -0.5;
export const INFLATION_MAX = 1;

export type CorrectionResult =
  | { ok: true; corrected: number; factor: number; accumulated: number; months: number }
  | { ok: false; error: 'order' | 'range' | 'missing' };

/** Valor de hoje descontado pela inflação: value / (1+inf)^years. */
export function toPresentValue(value: number, annualInflation: number, years: number): number {
  return value / Math.pow(1 + annualInflation, years);
}

/** Taxa real pela fórmula de Fisher: (1+nominal)/(1+inflação) − 1. */
export function realRate(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1;
}

/** Converte YYYY-MM em um índice de meses corridos, para somar meses sem erro de fuso. */
function monthIndex(month: string): number {
  const [yearPart = '', monthPart = ''] = month.split('-');
  return Number(yearPart) * 12 + (Number(monthPart) - 1);
}

/** Lista os meses de (from, to]: sem o mês inicial, com o mês final. */
function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  for (let i = monthIndex(from) + 1; i <= monthIndex(to); i++) {
    const year = Math.floor(i / 12);
    const month = (i % 12) + 1;
    months.push(`${year}-${String(month).padStart(2, '0')}`);
  }
  return months;
}

/**
 * Corrige um valor pelo IPCA mensal. O fator é o produto de (1+v) dos meses m com from < m ≤ to.
 * Ordem de verificação: 'order', depois 'range', depois 'missing'.
 */
export function correctByIpca(
  series: MonthlyPoint[],
  amount: number,
  from: string,
  to: string,
): CorrectionResult {
  if (from > to) return { ok: false, error: 'order' };

  const lastMonth = series.reduce((max, p) => (p.month > max ? p.month : max), '');
  if (from < REAL_START_MONTH || to > lastMonth) return { ok: false, error: 'range' };

  const byMonth = new Map(series.map((p) => [p.month, p.value]));
  const months = monthsBetween(from, to);

  let factor = 1;
  for (const month of months) {
    const value = byMonth.get(month);
    if (value === undefined) return { ok: false, error: 'missing' };
    factor *= 1 + value;
  }

  return {
    ok: true,
    corrected: amount * factor,
    factor,
    accumulated: factor - 1,
    months: months.length,
  };
}

/**
 * Poder de compra ao longo do tempo: quanto será necessário no futuro (amount·(1+i)^y)
 * e quanto esse valor futuro equivale hoje (amount/(1+i)^y).
 */
export function purchasingPower(
  amount: number,
  annualInflation: number,
  years: number,
): { neededInFuture: number; todayEquivalent: number } {
  const growth = Math.pow(1 + annualInflation, years);
  return {
    neededInFuture: amount * growth,
    todayEquivalent: amount / growth,
  };
}
