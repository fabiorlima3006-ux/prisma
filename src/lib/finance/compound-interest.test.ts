import { describe, expect, it } from 'vitest';
import { annualToMonthly, monthlyToAnnual } from './rates';
import { compoundInterest, compoundInterestInputSchema, yearlySummary } from './compound-interest';

describe('rates', () => {
  it('converte taxa anual em mensal e de volta', () => {
    expect(annualToMonthly(0.12)).toBeCloseTo(0.009488793, 8);
    expect(monthlyToAnnual(annualToMonthly(0.12))).toBeCloseTo(0.12, 10);
  });
});

describe('compoundInterest', () => {
  const r1 = compoundInterest({
    initial: 1000,
    monthlyContribution: 100,
    rate: 0.01,
    ratePeriod: 'month',
    months: 12,
  });

  it('calcula com aporte mensal', () => {
    expect(r1.finalBalance).toBeCloseTo(2395.08, 2);
    expect(r1.totalInvested).toBe(2200);
    expect(r1.totalInterest).toBeCloseTo(195.08, 2);
  });

  it('calcula sem aporte', () => {
    const r2 = compoundInterest({
      initial: 10000,
      monthlyContribution: 0,
      rate: 0.005,
      ratePeriod: 'month',
      months: 120,
    });
    expect(r2.finalBalance).toBeCloseTo(18193.97, 2);
  });

  it('trata taxa zero', () => {
    const r3 = compoundInterest({
      initial: 1000,
      monthlyContribution: 100,
      rate: 0,
      ratePeriod: 'month',
      months: 12,
    });
    expect(r3.finalBalance).toBe(2200);
    expect(r3.totalInterest).toBe(0);
  });

  it('converte taxa anual', () => {
    const r4 = compoundInterest({
      initial: 1000,
      monthlyContribution: 0,
      rate: 0.12,
      ratePeriod: 'year',
      months: 12,
    });
    expect(r4.finalBalance).toBeCloseTo(1120, 6);
  });

  it('tabela iterativa coincide com a fórmula fechada', () => {
    expect(r1.rows.at(-1)!.balance).toBeCloseTo(r1.finalBalance, 6);
    expect(r1.rows).toHaveLength(12);
  });

  it('extremos continuam finitos', () => {
    const big = compoundInterest({
      initial: 1e12,
      monthlyContribution: 1e12,
      rate: 1,
      ratePeriod: 'month',
      months: 600,
    });
    expect(Number.isFinite(big.finalBalance)).toBe(true);
    expect(yearlySummary(big.rows).length).toBeLessThanOrEqual(50);
  });
});

describe('yearlySummary', () => {
  const base = {
    initial: 1000,
    monthlyContribution: 100,
    rate: 0.01,
    ratePeriod: 'month' as const,
  };
  it('uma linha por ano completo', () => {
    const rows = compoundInterest({ ...base, months: 24 }).rows;
    expect(yearlySummary(rows).map((r) => r.month)).toEqual([12, 24]);
  });
  it('inclui o último ano parcial', () => {
    const rows = compoundInterest({ ...base, months: 30 }).rows;
    expect(yearlySummary(rows).map((r) => r.month)).toEqual([12, 24, 30]);
  });
  it('600 meses geram 50 linhas', () => {
    expect(yearlySummary(compoundInterest({ ...base, months: 600 }).rows)).toHaveLength(50);
  });
});

describe('compoundInterestInputSchema', () => {
  const ok = { initial: 0, monthlyContribution: 0, rate: 0.01, ratePeriod: 'month', months: 12 };
  it('aceita entrada válida', () => {
    expect(compoundInterestInputSchema.safeParse(ok).success).toBe(true);
  });
  it('recusa prazo acima de 600', () => {
    const r = compoundInterestInputSchema.safeParse({ ...ok, months: 601 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('Informe um prazo entre 1 e 600 meses');
  });
  it('recusa prazo não inteiro ou zero', () => {
    expect(compoundInterestInputSchema.safeParse({ ...ok, months: 1.5 }).success).toBe(false);
    expect(compoundInterestInputSchema.safeParse({ ...ok, months: 0 }).success).toBe(false);
  });
  it('recusa valor negativo', () => {
    const r = compoundInterestInputSchema.safeParse({ ...ok, initial: -1 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('O valor não pode ser negativo');
  });
  it('recusa taxa acima do limite', () => {
    expect(compoundInterestInputSchema.safeParse({ ...ok, rate: 1.01 }).success).toBe(false);
    expect(
      compoundInterestInputSchema.safeParse({ ...ok, rate: 10001, ratePeriod: 'year' }).success,
    ).toBe(false);
    expect(
      compoundInterestInputSchema.safeParse({ ...ok, rate: 10000, ratePeriod: 'year', months: 12 })
        .success,
    ).toBe(true);
  });
  it('recusa NaN e Infinity', () => {
    expect(compoundInterestInputSchema.safeParse({ ...ok, rate: Number.NaN }).success).toBe(false);
    expect(compoundInterestInputSchema.safeParse({ ...ok, initial: Infinity }).success).toBe(false);
  });
});
