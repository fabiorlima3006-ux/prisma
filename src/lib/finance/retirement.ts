import { z } from 'zod';
import '@/lib/zod-setup';
import { annualToMonthly } from './rates';

const MAX_VALUE = 1e12;
const MAX_AGE = 100;
const MAX_MONTHS = 1200;
const AGE_MSG = 'Informe uma idade entre 18 e 100 anos';
const TARGET_MSG = 'A idade-alvo deve ser maior que a idade atual e no máximo 100';
const RETURN_MSG = 'Informe uma rentabilidade real entre 0% e 15% a.a.';
const NUMERIC = 'Informe um valor numérico';

const money = z
  .number({ error: NUMERIC })
  .finite(NUMERIC)
  .min(0, 'O valor não pode ser negativo')
  .max(MAX_VALUE, 'O valor informado é grande demais');

export type RetirementInput = {
  currentAge: number;
  targetAge: number | null;
  currentWealth: number;
  monthlyContribution: number;
  desiredMonthlyIncome: number;
  /** Fração anual acima da inflação (0.04 = 4%), entre 0 e 0,15. */
  realAnnualReturn: number;
};

export type RetirementResult = {
  requiredWealth: number | null;
  monthsToTarget: number | null;
  ageAtTarget: { years: number; months: number } | null;
  contributionForTargetAge: number | 'already-covered' | null;
  yearly: { age: number; wealth: number }[];
};

export const retirementInputSchema: z.ZodType<RetirementInput> = z
  .object({
    currentAge: z.number({ error: AGE_MSG }).int(AGE_MSG).min(18, AGE_MSG).max(MAX_AGE, AGE_MSG),
    targetAge: z.number({ error: TARGET_MSG }).int(TARGET_MSG).max(MAX_AGE, TARGET_MSG).nullable(),
    currentWealth: money,
    monthlyContribution: money,
    desiredMonthlyIncome: money.refine((v) => v > 0, 'A renda desejada deve ser maior que zero'),
    realAnnualReturn: z
      .number({ error: RETURN_MSG })
      .finite(RETURN_MSG)
      .min(0, RETURN_MSG)
      .max(0.15, RETURN_MSG),
  })
  .superRefine((v, ctx) => {
    if (v.targetAge !== null && v.targetAge <= v.currentAge) {
      ctx.addIssue({ code: 'custom', path: ['targetAge'], message: TARGET_MSG });
    }
  });

/** Plano de aposentadoria pela perpetuidade real: patrimônio que rende a renda desejada sem consumir o principal. */
export function retirementPlan(input: RetirementInput): RetirementResult {
  const { currentAge, targetAge, currentWealth: w0, monthlyContribution: pmt } = input;
  const i = annualToMonthly(input.realAnnualReturn);
  const hasReturn = input.realAnnualReturn > 0;
  const required = hasReturn ? input.desiredMonthlyIncome / i : null;
  const step = (b: number) => b * (1 + i) + pmt;

  let monthsToTarget: number | null = null;
  if (required !== null) {
    let b = w0;
    for (let n = 0; n <= MAX_MONTHS; n++) {
      if (b >= required) {
        monthsToTarget = n;
        break;
      }
      b = step(b);
    }
  }

  const ageAtTarget =
    monthsToTarget === null
      ? null
      : { years: currentAge + Math.floor(monthsToTarget / 12), months: monthsToTarget % 12 };

  let contributionForTargetAge: RetirementResult['contributionForTargetAge'] = null;
  if (required !== null && targetAge !== null) {
    const n = (targetAge - currentAge) * 12;
    const growth = Math.pow(1 + i, n);
    const needed = ((required - w0 * growth) * i) / (growth - 1);
    contributionForTargetAge = needed <= 0 ? 'already-covered' : needed;
  }

  const candidates = [ageAtTarget?.years, targetAge ?? undefined].filter(
    (a): a is number => a !== undefined,
  );
  const lastAge = Math.min(MAX_AGE, candidates.length ? Math.max(...candidates) : MAX_AGE);

  const yearly = [{ age: currentAge, wealth: w0 }];
  let b = w0;
  for (let age = currentAge + 1; age <= lastAge; age++) {
    for (let m = 0; m < 12; m++) b = step(b);
    yearly.push({ age, wealth: b });
  }

  return {
    requiredWealth: required,
    monthsToTarget,
    ageAtTarget,
    contributionForTargetAge,
    yearly,
  };
}
