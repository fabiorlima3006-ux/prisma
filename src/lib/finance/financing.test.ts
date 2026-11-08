import { describe, expect, it } from 'vitest';
import { annualToMonthly } from './rates';
import {
  compareSystems,
  financingInputSchema,
  simulateFinancing,
  type FinancingInput,
} from './financing';

const base: FinancingInput = {
  principal: 100_000,
  rate: 0.01,
  ratePeriod: 'month',
  months: 12,
  extraMonthly: 0,
};

describe('simulateFinancing', () => {
  it('Price: parcela fixa e juros totais conhecidos', () => {
    const r = simulateFinancing(base, 'price');
    expect(r.firstInstallment).toBeCloseTo(8884.88, 2);
    expect(r.totalInterest).toBeCloseTo(6618.55, 2);
    expect(r.rows).toHaveLength(12);
    expect(r.months).toBe(12);
  });

  it('SAC: parcelas decrescentes', () => {
    const r = simulateFinancing(base, 'sac');
    expect(r.firstInstallment).toBeCloseTo(9333.33, 2);
    expect(r.lastInstallment).toBeCloseTo(8416.67, 2);
    expect(r.totalInterest).toBeCloseTo(6500, 2);
  });

  it('taxa zero: sem juros e parcela PV/n', () => {
    for (const s of ['sac', 'price'] as const) {
      const r = simulateFinancing({ ...base, rate: 0 }, s);
      expect(r.totalInterest).toBe(0);
      expect(r.firstInstallment).toBeCloseTo(100_000 / 12, 2);
    }
  });

  it('prazo 1 gera uma linha', () => {
    expect(simulateFinancing({ ...base, months: 1 }, 'price').rows).toHaveLength(1);
    expect(simulateFinancing({ ...base, months: 1 }, 'sac').rows).toHaveLength(1);
  });

  it('extra na Price reduz prazo e juros, sem saldo negativo', () => {
    const r = simulateFinancing({ ...base, extraMonthly: 1000 }, 'price');
    expect(r.months).toBeLessThan(12);
    expect(r.totalInterest).toBeLessThan(6618.55);
    expect(r.rows.every((x) => x.balance >= 0)).toBe(true);
    expect(r.rows.at(-1)!.balance).toBe(0);
    const c = compareSystems({ ...base, extraMonthly: 1000 });
    expect(c.savings!.price.interest).toBeGreaterThan(0);
    expect(c.savings!.price.months).toBeGreaterThan(0);
    expect(c.savings!.sac.interest).toBeGreaterThan(0);
  });

  it('savings é null sem extra', () => {
    expect(compareSystems(base).savings).toBeNull();
  });

  it('extra enorme quita no mês 1', () => {
    for (const s of ['sac', 'price'] as const) {
      const r = simulateFinancing({ ...base, extraMonthly: 200_000 }, s);
      expect(r.rows).toHaveLength(1);
      expect(r.rows[0]!.balance).toBe(0);
    }
  });

  it('420 meses a 2% a.m. gera valores finitos', () => {
    for (const s of ['sac', 'price'] as const) {
      const r = simulateFinancing({ ...base, rate: 0.02, months: 420 }, s);
      expect(Number.isFinite(r.totalPaid)).toBe(true);
      expect(Number.isFinite(r.totalInterest)).toBe(true);
      expect(r.rows).toHaveLength(420);
    }
  });

  it('12% a.a. usa a taxa mensal equivalente', () => {
    const r = simulateFinancing({ ...base, rate: 0.12, ratePeriod: 'year' }, 'price');
    expect(r.rows[0]!.interest).toBeCloseTo(100_000 * annualToMonthly(0.12), 6);
  });

  it('totalPaid inclui extras', () => {
    const r = simulateFinancing({ ...base, extraMonthly: 1000 }, 'sac');
    expect(r.totalPaid).toBeCloseTo(100_000 + r.totalInterest, 2);
  });
});

describe('financingInputSchema', () => {
  it('valida limites', () => {
    expect(financingInputSchema.safeParse(base).success).toBe(true);
    expect(financingInputSchema.safeParse({ ...base, principal: 0 }).success).toBe(false);
    expect(financingInputSchema.safeParse({ ...base, months: 421 }).success).toBe(false);
    expect(financingInputSchema.safeParse({ ...base, months: 1.5 }).success).toBe(false);
    expect(financingInputSchema.safeParse({ ...base, rate: 1.5 }).success).toBe(false);
    expect(financingInputSchema.safeParse({ ...base, extraMonthly: -1 }).success).toBe(false);
  });
});
