import { describe, expect, it } from 'vitest';
import type { TaxRules } from '../config/tax-rules';
import {
  PRODUCT_META,
  compareFixedIncome,
  comparatorInputSchema,
  highestNet,
  type ComparisonRow,
  type ProductId,
} from './fixed-income';

const V = { source: 'x', verifiedAt: null };
const R: TaxRules = {
  incomeTaxBrackets: {
    effectiveFrom: '2005-01-01',
    source: 'x',
    verifiedAt: null,
    brackets: [
      { upToDays: 180, rate: 0.225 },
      { upToDays: 360, rate: 0.2 },
      { upToDays: 720, rate: 0.175 },
      { upToDays: null, rate: 0.15 },
    ],
  },
  lciLca: {
    effectiveFrom: '2025-05-23',
    source: 'x',
    verifiedAt: null,
    pfExempt: true,
    minHoldingDays: { lci: 270, lca: 270 },
    verification: { lci: V, lca: V },
  },
  tesouroCustody: {
    effectiveFrom: '2022-01-01',
    source: 'x',
    verifiedAt: null,
    annualRate: 0.002,
    selicExemptUpTo: 10000,
  },
  savings: {
    effectiveFrom: '2012-08-08',
    source: 'x',
    verifiedAt: null,
    selicThreshold: 0.085,
    fixedMonthly: 0.005,
    selicShare: 0.7,
  },
};

const base = {
  amount: 10000,
  calendarDays: 365,
  cdbPctCdi: 1,
  lciLcaPctCdi: 0.9,
  rates: { cdiAnnual: 0.1, selicAnnual: 0.105, trMonthly: 0 },
};
const rows = compareFixedIncome(base, R);
const get = (rs: ComparisonRow[], p: ProductId) => {
  const r = rs.find((x) => x.product === p);
  if (!r || !r.available) throw new Error(`linha indisponível: ${p}`);
  return r;
};

describe('compareFixedIncome', () => {
  it('mantém a ordem fixa', () => {
    expect(rows.map((r) => r.product)).toEqual(['savings', 'cdb', 'tesouro-selic', 'lci', 'lca']);
  });
  it('CDB com IR regressivo', () => {
    const cdb = get(rows, 'cdb');
    expect(cdb.gross).toBeCloseTo(11000, 2);
    expect(cdb.tax).toBeCloseTo(175, 2);
    expect(cdb.net).toBeCloseTo(10825, 2);
  });
  it('LCI isenta de IR', () => {
    expect(get(rows, 'lci').net).toBeCloseTo(10895.67, 0);
    expect(get(rows, 'lci').tax).toBe(0);
  });
  it('poupança', () => {
    expect(get(rows, 'savings').net).toBeCloseTo(10616.78, 2);
    const low = compareFixedIncome({ ...base, rates: { ...base.rates, selicAnnual: 0.07 } }, R);
    expect(get(low, 'savings').net).toBeCloseTo(10490, 2);
    const tr = compareFixedIncome({ ...base, rates: { ...base.rates, trMonthly: 0.001 } }, R);
    expect(get(tr, 'savings').net).toBeCloseTo(10000 * 1.006005 ** 12, 2);
  });
  it('Tesouro Selic e custódia', () => {
    expect(get(rows, 'tesouro-selic').costs).toBe(0);
    expect(get(rows, 'tesouro-selic').net).toBeCloseTo(10866.25, 2);
    const t2 = get(compareFixedIncome({ ...base, amount: 20000 }, R), 'tesouro-selic');
    expect(t2.costs).toBeCloseTo(0.002 * 10000 * (252 / 252), 2);
  });
  it('carência de LCI/LCA', () => {
    const short = compareFixedIncome({ ...base, calendarDays: 269 }, R);
    expect(short.find((r) => r.product === 'lci')).toMatchObject({
      available: false,
      reason: expect.stringContaining('270'),
    });
    expect(
      compareFixedIncome({ ...base, calendarDays: 270 }, R).find((r) => r.product === 'lci')!
        .available,
    ).toBe(true);
  });
  it('retornos líquidos', () => {
    const cdb = get(rows, 'cdb');
    expect(cdb.netReturn).toBeCloseTo(0.0825, 6);
    expect(cdb.netReturnAnnualized).toBeCloseTo(0.0825, 6);
  });
});

describe('highestNet', () => {
  it('empate vai para a primeira na ordem', () => {
    expect(highestNet(rows)).toBe('lci');
  });
  it('ignora indisponíveis', () => {
    expect(highestNet(compareFixedIncome({ ...base, calendarDays: 269 }, R))).toBe('tesouro-selic');
  });
  it('sem linhas disponíveis retorna null', () => {
    expect(highestNet([{ product: 'lci', available: false, reason: 'x' }])).toBeNull();
  });
});

describe('comparatorInputSchema', () => {
  it('valida prazo mínimo', () => {
    const r = comparatorInputSchema.safeParse({ ...base, calendarDays: 29 });
    expect(r.success).toBe(false);
    expect(comparatorInputSchema.safeParse(base).success).toBe(true);
  });
  it('rejeita valores inválidos', () => {
    expect(comparatorInputSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(comparatorInputSchema.safeParse({ ...base, cdbPctCdi: 6 }).success).toBe(false);
    expect(
      comparatorInputSchema.safeParse({ ...base, rates: { ...base.rates, cdiAnnual: -1 } }).success,
    ).toBe(false);
  });
});

describe('PRODUCT_META', () => {
  it('tem rótulo e fonte para todos', () => {
    for (const p of ['savings', 'cdb', 'tesouro-selic', 'lci', 'lca'] as const) {
      expect(PRODUCT_META[p].label).toBeTruthy();
      expect(PRODUCT_META[p].source).toMatch(/^https:\/\//);
    }
  });
});
