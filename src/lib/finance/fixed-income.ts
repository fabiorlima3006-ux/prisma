import { z } from 'zod';
import type { TaxRules } from '../config/tax-rules';
import { PRODUCT_META, type ProductId } from './fixed-income-meta';
import { businessDaysApprox, incomeTaxRate } from './tax';

export { PRODUCT_META };
export type { ProductId };

/** Taxas em FRAÇÃO: cdiAnnual 0.10 = 10% a.a.; trMonthly 0.001 = 0,1% a.m. */
export type ComparatorInput = {
  amount: number;
  calendarDays: number;
  /** 1 = 100% do CDI */
  cdbPctCdi: number;
  lciLcaPctCdi: number;
  rates: { cdiAnnual: number; selicAnnual: number; trMonthly: number };
};

export type ComparisonRow =
  | {
      product: ProductId;
      available: true;
      gross: number;
      tax: number;
      costs: number;
      net: number;
      /** net/amount − 1 (retorno líquido no período) */
      netReturn: number;
      /** (net/amount)^(252/du) − 1, base de dias úteis; comparável entre linhas */
      netReturnAnnualized: number;
    }
  | { product: ProductId; available: false; reason: string };

const pct = z
  .number({ error: 'Informe um número válido' })
  .gt(0, 'O percentual deve ser maior que zero')
  .max(5, 'O percentual máximo é 500% do CDI');

export const comparatorInputSchema: z.ZodType<ComparatorInput> = z.object({
  amount: z
    .number({ error: 'Informe um valor válido' })
    .gt(0, 'O valor deve ser maior que zero')
    .max(1e12, 'O valor máximo é R$ 1 trilhão'),
  calendarDays: z
    .number({ error: 'Informe um prazo válido' })
    .int('O prazo deve ser um número inteiro de dias')
    .min(30, 'O prazo mínimo é de 30 dias')
    .max(36500, 'O prazo máximo é de 36.500 dias'),
  cdbPctCdi: pct,
  lciLcaPctCdi: pct,
  rates: z.object({
    cdiAnnual: z.number({ error: 'Informe um número válido' }).min(0, 'A taxa não pode ser negativa').max(1, 'A taxa máxima é 100% a.a.'),
    selicAnnual: z.number({ error: 'Informe um número válido' }).min(0, 'A taxa não pode ser negativa').max(1, 'A taxa máxima é 100% a.a.'),
    trMonthly: z.number({ error: 'Informe um número válido' }).min(0, 'A taxa não pode ser negativa').max(0.1, 'A TR máxima é 10% a.m.'),
  }),
});

const ORDER: ProductId[] = ['savings', 'cdb', 'tesouro-selic', 'lci', 'lca'];

function row(product: ProductId, amount: number, du: number, gross: number, tax: number, costs: number): ComparisonRow {
  const net = gross - tax - costs;
  const ratio = net / amount;
  return {
    product,
    available: true,
    gross,
    tax,
    costs,
    net,
    netReturn: ratio - 1,
    netReturnAnnualized: Math.pow(ratio, 252 / du) - 1,
  };
}

/** Fator pós-fixado em % do CDI, convenção diária de mercado: (1 + p·((1+CDI)^(1/252) − 1))^du. */
function cdiFactor(p: number, cdi: number, du: number): number {
  return Math.pow(1 + p * (Math.pow(1 + cdi, 1 / 252) - 1), du);
}

export function compareFixedIncome(input: ComparatorInput, rules: TaxRules): ComparisonRow[] {
  const { amount, calendarDays, rates } = input;
  const du = businessDaysApprox(calendarDays);
  const taxRate = incomeTaxRate(calendarDays, rules.incomeTaxBrackets);

  // Poupança: meses completos, isenta de IR.
  const s = rules.savings;
  const months = Math.floor(calendarDays / 30);
  const base = rates.selicAnnual > s.selicThreshold ? s.fixedMonthly : Math.pow(1 + s.selicShare * rates.selicAnnual, 1 / 12) - 1;
  const savingsGross = amount * Math.pow((1 + base) * (1 + rates.trMonthly), months);

  const cdbGross = amount * cdiFactor(input.cdbPctCdi, rates.cdiAnnual, du);

  const tesouroGross = amount * Math.pow(1 + rates.selicAnnual, du / 252);
  const c = rules.tesouroCustody;
  const tesouroCosts = c.annualRate * Math.max(0, amount - c.selicExemptUpTo) * (du / 252);

  const exempt = (product: 'lci' | 'lca'): ComparisonRow => {
    const min = rules.lciLca.minHoldingDays[product];
    if (calendarDays < min) {
      return { product, available: false, reason: `não disponível para este prazo (carência mínima de ${min} dias)` };
    }
    const gross = amount * cdiFactor(input.lciLcaPctCdi, rates.cdiAnnual, du);
    const tax = rules.lciLca.pfExempt ? 0 : (gross - amount) * taxRate;
    return row(product, amount, du, gross, tax, 0);
  };

  return [
    row('savings', amount, du, savingsGross, 0, 0),
    row('cdb', amount, du, cdbGross, (cdbGross - amount) * taxRate, 0),
    row('tesouro-selic', amount, du, tesouroGross, (tesouroGross - amount) * taxRate, tesouroCosts),
    exempt('lci'),
    exempt('lca'),
  ];
}

/** Produto de maior valor líquido entre as linhas disponíveis; empate → primeira na ordem fixa. */
export function highestNet(rows: ComparisonRow[]): ProductId | null {
  let best: { product: ProductId; net: number } | null = null;
  for (const p of ORDER) {
    const r = rows.find((x) => x.product === p);
    if (r && r.available && (best === null || r.net > best.net)) best = { product: p, net: r.net };
  }
  return best ? best.product : null;
}
