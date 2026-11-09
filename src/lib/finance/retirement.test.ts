import { describe, expect, it } from 'vitest';
import { retirementInputSchema, retirementPlan, type RetirementInput } from './retirement';

const base: RetirementInput = {
  currentAge: 30,
  targetAge: 60,
  currentWealth: 0,
  monthlyContribution: 2000,
  desiredMonthlyIncome: 5000,
  realAnnualReturn: 0.04,
};
const monthly = (a: number) => (1 + a) ** (1 / 12) - 1;

describe('retirementPlan', () => {
  it('calcula o patrimônio necessário como perpetuidade real', () => {
    const r = retirementPlan(base);
    expect(r.requiredWealth).toBeCloseTo(5000 / monthly(0.04), 6);
    expect(r.requiredWealth).toBeCloseTo(1527305.26, 0);
  });

  it('retorno real 0 deixa tudo nulo, exceto a evolução anual', () => {
    const r = retirementPlan({ ...base, realAnnualReturn: 0 });
    expect(r.requiredWealth).toBeNull();
    expect(r.monthsToTarget).toBeNull();
    expect(r.ageAtTarget).toBeNull();
    expect(r.contributionForTargetAge).toBeNull();
    expect(r.yearly[0]).toEqual({ age: 30, wealth: 0 });
    expect(r.yearly[1]).toEqual({ age: 31, wealth: 24000 });
  });

  it('patrimônio atual já suficiente', () => {
    const r = retirementPlan({ ...base, currentWealth: 2_000_000 });
    expect(r.monthsToTarget).toBe(0);
    expect(r.ageAtTarget).toEqual({ years: 30, months: 0 });
    expect(r.contributionForTargetAge).toBe('already-covered');
  });

  it('alvo atingido depois da idade-alvo: a evolução vai até a idade em que atinge', () => {
    const r = retirementPlan({ ...base, targetAge: 40 });
    expect(r.ageAtTarget!.years).toBeGreaterThan(40);
    expect(r.yearly.at(-1)?.age).toBe(r.ageAtTarget!.years);
  });

  it('sem patrimônio nem aporte nunca atinge', () => {
    const r = retirementPlan({ ...base, monthlyContribution: 0 });
    expect(r.monthsToTarget).toBeNull();
    expect(r.ageAtTarget).toBeNull();
    expect(r.yearly.at(-1)?.age).toBe(60);
  });

  it('monthsToTarget confere com laço manual', () => {
    const input = { ...base, currentWealth: 100_000, targetAge: null };
    const r = retirementPlan(input);
    const i = monthly(0.04);
    const req = 5000 / i;
    let b = 100_000;
    let n = 0;
    while (b < req) {
      b = b * (1 + i) + 2000;
      n++;
    }
    expect(r.monthsToTarget).toBe(n);
    expect(r.ageAtTarget).toEqual({ years: 30 + Math.floor(n / 12), months: n % 12 });
    expect(r.contributionForTargetAge).toBeNull();
    expect(r.yearly[0]).toEqual({ age: 30, wealth: 100_000 });
    expect(r.yearly.at(-1)?.age).toBe(30 + Math.floor(n / 12));
  });

  it('PMT leva ao patrimônio necessário na idade-alvo', () => {
    const r = retirementPlan({ ...base, monthlyContribution: 0 });
    expect(typeof r.contributionForTargetAge).toBe('number');
    const pmt = r.contributionForTargetAge as number;
    const i = monthly(0.04);
    let b = 0;
    for (let k = 0; k < 360; k++) b = b * (1 + i) + pmt;
    expect(Math.abs(b - (r.requiredWealth as number))).toBeLessThan(0.01);
  });

  it('limita a evolução anual a 100 anos', () => {
    const r = retirementPlan({ ...base, currentAge: 90, targetAge: null, monthlyContribution: 0 });
    expect(r.yearly.at(-1)?.age).toBe(100);
  });
});

describe('retirementInputSchema', () => {
  it('aceita entrada válida', () => {
    expect(retirementInputSchema.safeParse(base).success).toBe(true);
    expect(retirementInputSchema.safeParse({ ...base, targetAge: null }).success).toBe(true);
  });

  it('rejeita idade-alvo menor ou igual à atual', () => {
    const r = retirementInputSchema.safeParse({ ...base, targetAge: 30 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toBe(
        'A idade-alvo deve ser maior que a idade atual e no máximo 100',
      );
    }
  });

  it('rejeita idade fora de 18..100, renda 0 e retorno fora de 0..0,15', () => {
    const msg = (v: Partial<RetirementInput>) => {
      const r = retirementInputSchema.safeParse({ ...base, ...v });
      return r.success ? null : r.error.issues[0]?.message;
    };
    expect(msg({ currentAge: 17 })).toBe('Informe uma idade entre 18 e 100 anos');
    expect(msg({ targetAge: 101 })).toBe(
      'A idade-alvo deve ser maior que a idade atual e no máximo 100',
    );
    expect(msg({ desiredMonthlyIncome: 0 })).not.toBeNull();
    expect(msg({ currentWealth: -1 })).not.toBeNull();
    expect(msg({ realAnnualReturn: 0.16 })).toBe(
      'Informe uma rentabilidade real entre 0% e 15% a.a.',
    );
  });
});
