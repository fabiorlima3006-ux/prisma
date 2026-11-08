import { z } from 'zod';
import '@/lib/zod-setup';
import { MAX_ANNUAL_RATE, MAX_MONTHLY_RATE } from './compound-interest';
import { annualToMonthly } from './rates';

const MAX_VALUE = 1e12;
const NUMERIC = 'Informe um valor numérico';
const PRINCIPAL_MSG = 'Informe um valor entre R$ 0,01 e R$ 1 trilhão';
const MONTHS_MSG = 'Informe um prazo entre 1 e 420 meses';
const PAID_OFF = 0.005;

export type FinancingInput = {
  principal: number;
  /** Fração (0.01 = 1%). */
  rate: number;
  ratePeriod: 'month' | 'year';
  /** 1 a 420. */
  months: number;
  extraMonthly: number;
};

export type FinancingRow = {
  month: number;
  /** Juros + amortização regular (sem o extra). */
  installment: number;
  interest: number;
  amortization: number;
  extra: number;
  balance: number;
};

export type FinancingResult = {
  rows: FinancingRow[];
  firstInstallment: number;
  lastInstallment: number;
  /** Inclui amortizações extras. */
  totalPaid: number;
  totalInterest: number;
  months: number;
};

export type FinancingSystem = 'sac' | 'price';

export const financingInputSchema: z.ZodType<FinancingInput> = z
  .object({
    principal: z
      .number({ error: PRINCIPAL_MSG })
      .finite(PRINCIPAL_MSG)
      .min(0.01, PRINCIPAL_MSG)
      .max(MAX_VALUE, PRINCIPAL_MSG),
    rate: z
      .number({ error: 'Informe uma taxa numérica' })
      .finite('Informe uma taxa numérica')
      .min(0, 'A taxa não pode ser negativa'),
    ratePeriod: z.enum(['month', 'year'], { error: 'Período da taxa inválido' }),
    months: z.number({ error: MONTHS_MSG }).int(MONTHS_MSG).min(1, MONTHS_MSG).max(420, MONTHS_MSG),
    extraMonthly: z
      .number({ error: NUMERIC })
      .finite(NUMERIC)
      .min(0, 'O valor não pode ser negativo')
      .max(MAX_VALUE, 'O valor informado é grande demais'),
  })
  .superRefine((v, ctx) => {
    const limit = v.ratePeriod === 'month' ? MAX_MONTHLY_RATE : MAX_ANNUAL_RATE;
    if (v.rate > limit) {
      ctx.addIssue({ code: 'custom', path: ['rate'], message: 'Taxa acima do limite permitido' });
    }
  });

/** Simula um financiamento SAC ou Price, com amortização extra mensal opcional. */
export function simulateFinancing(input: FinancingInput, system: FinancingSystem): FinancingResult {
  const { principal, months, extraMonthly } = input;
  const i = input.ratePeriod === 'year' ? annualToMonthly(input.rate) : input.rate;
  const pmt = i === 0 ? principal / months : (principal * i) / (1 - Math.pow(1 + i, -months));

  const rows: FinancingRow[] = [];
  let balance = principal;
  let totalPaid = 0;
  let totalInterest = 0;

  // Com extra o saldo quita antes do prazo; o limite evita laço infinito por segurança.
  for (let month = 1; month <= months && balance > PAID_OFF; month++) {
    const interest = balance * i;
    const regular = system === 'sac' ? principal / months : pmt - interest;
    const amortization = Math.min(Math.max(regular, 0), balance);
    let remaining = balance - amortization;
    const extra = Math.min(extraMonthly, remaining);
    remaining -= extra;
    if (remaining <= PAID_OFF) remaining = 0;
    balance = remaining;

    const installment = interest + amortization;
    rows.push({ month, installment, interest, amortization, extra, balance });
    totalPaid += installment + extra;
    totalInterest += interest;
  }

  return {
    rows,
    firstInstallment: rows[0]!.installment,
    lastInstallment: rows[rows.length - 1]!.installment,
    totalPaid,
    totalInterest,
    months: rows.length,
  };
}

type Savings = { interest: number; months: number };

/** Compara SAC e Price; `savings` mostra o efeito do extra em cada sistema (null sem extra). */
export function compareSystems(input: FinancingInput): {
  sac: FinancingResult;
  price: FinancingResult;
  savings: { sac: Savings; price: Savings } | null;
} {
  const sac = simulateFinancing(input, 'sac');
  const price = simulateFinancing(input, 'price');
  if (input.extraMonthly <= 0) return { sac, price, savings: null };

  const noExtra = { ...input, extraMonthly: 0 };
  const diff = (base: FinancingResult, withExtra: FinancingResult): Savings => ({
    interest: base.totalInterest - withExtra.totalInterest,
    months: base.months - withExtra.months,
  });
  return {
    sac,
    price,
    savings: {
      sac: diff(simulateFinancing(noExtra, 'sac'), sac),
      price: diff(simulateFinancing(noExtra, 'price'), price),
    },
  };
}
