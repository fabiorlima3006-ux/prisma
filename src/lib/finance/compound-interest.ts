import { z } from 'zod';
import '@/lib/zod-setup';
import { annualToMonthly } from './rates';

const MAX_VALUE = 1e12;
/**
 * Teto da taxa (fração): 100% a.m. e o equivalente anual exato, (1 + 1)^12 − 1 = 4.095,
 * ou seja, 409.500% a.a. Assim os dois períodos aceitam o mesmo crescimento máximo.
 */
export const MAX_MONTHLY_RATE = 1;
export const MAX_ANNUAL_RATE = (1 + MAX_MONTHLY_RATE) ** 12 - 1;
const NEGATIVE = 'O valor não pode ser negativo';
const TOO_BIG = 'O valor informado é grande demais';

const money = z
  .number({ error: 'Informe um valor numérico' })
  .finite('Informe um valor numérico')
  .min(0, NEGATIVE)
  .max(MAX_VALUE, TOO_BIG);

export type CompoundInterestInput = {
  initial: number;
  monthlyContribution: number;
  /** Fração (0.01 = 1%). */
  rate: number;
  ratePeriod: 'month' | 'year';
  months: number;
};

export type MonthRow = { month: number; invested: number; interest: number; balance: number };

export type CompoundInterestResult = {
  finalBalance: number;
  totalInvested: number;
  totalInterest: number;
  monthlyRate: number;
  rows: MonthRow[];
};

function toMonthlyRate(rate: number, period: 'month' | 'year'): number {
  return period === 'year' ? annualToMonthly(rate) : rate;
}

export const compoundInterestInputSchema: z.ZodType<CompoundInterestInput> = z
  .object({
    initial: money,
    monthlyContribution: money,
    rate: z
      .number({ error: 'Informe uma taxa numérica' })
      .finite('Informe uma taxa numérica')
      .min(0, 'A taxa não pode ser negativa'),
    ratePeriod: z.enum(['month', 'year'], { error: 'Período da taxa inválido' }),
    months: z
      .number({ error: 'Informe um prazo entre 1 e 600 meses' })
      .int('Informe um prazo entre 1 e 600 meses')
      .min(1, 'Informe um prazo entre 1 e 600 meses')
      .max(600, 'Informe um prazo entre 1 e 600 meses'),
  })
  .superRefine((v, ctx) => {
    const limit = v.ratePeriod === 'month' ? MAX_MONTHLY_RATE : MAX_ANNUAL_RATE;
    if (v.rate > limit) {
      ctx.addIssue({ code: 'custom', path: ['rate'], message: 'Taxa acima do limite permitido' });
      return;
    }
    const growth = Math.pow(1 + toMonthlyRate(v.rate, v.ratePeriod), v.months);
    const worst = (v.initial + v.monthlyContribution * v.months) * growth;
    if (!Number.isFinite(growth) || !Number.isFinite(worst)) {
      ctx.addIssue({ code: 'custom', message: 'Combinação de valores grande demais para simular' });
    }
  });

export function compoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const { initial, monthlyContribution, months } = input;
  const i = toMonthlyRate(input.rate, input.ratePeriod);

  const rows: MonthRow[] = [];
  let balance = initial;
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + i) + monthlyContribution;
    const invested = initial + monthlyContribution * m;
    rows.push({ month: m, invested, interest: balance - invested, balance });
  }

  const totalInvested = initial + monthlyContribution * months;
  const growth = Math.pow(1 + i, months);
  const finalBalance =
    i === 0 ? totalInvested : initial * growth + (monthlyContribution * (growth - 1)) / i;

  return {
    finalBalance,
    totalInvested,
    totalInterest: finalBalance - totalInvested,
    monthlyRate: i,
    rows,
  };
}

/** Uma linha por ano completo (mês 12, 24, …) mais a última linha parcial, se houver. */
export function yearlySummary(rows: MonthRow[]): MonthRow[] {
  const last = rows[rows.length - 1];
  const out = rows.filter((r) => r.month % 12 === 0);
  if (last && last.month % 12 !== 0) out.push(last);
  return out;
}
