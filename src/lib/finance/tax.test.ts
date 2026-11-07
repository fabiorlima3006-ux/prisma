import { describe, expect, it } from 'vitest';
import { TAX_RULES } from '../config/tax-rules';
import { businessDaysApprox, incomeTaxRate } from './tax';

const B = {
  effectiveFrom: '2005-01-01',
  source: 'x',
  verifiedAt: null,
  brackets: [
    { upToDays: 180, rate: 0.225 },
    { upToDays: 360, rate: 0.2 },
    { upToDays: 720, rate: 0.175 },
    { upToDays: null, rate: 0.15 },
  ],
};

describe('incomeTaxRate', () => {
  it('usa limites superiores inclusivos', () => {
    expect([180, 181, 360, 361, 720, 721].map((d) => incomeTaxRate(d, B))).toEqual([
      0.225, 0.2, 0.2, 0.175, 0.175, 0.15,
    ]);
  });
  it('trata prazo menor que 1 dia como a primeira faixa', () => {
    expect(incomeTaxRate(1, B)).toBe(0.225);
    expect(incomeTaxRate(0, B)).toBe(0.225);
  });
  it('usa a tabela padrão quando não recebe regras', () => {
    expect(incomeTaxRate(1000)).toBe(TAX_RULES.incomeTaxBrackets.brackets.at(-1)?.rate);
  });
});

describe('businessDaysApprox', () => {
  it('aproxima dias úteis', () => {
    expect(businessDaysApprox(30)).toBe(21);
    expect(businessDaysApprox(365)).toBe(252);
  });
});

describe('TAX_RULES', () => {
  it('tem fonte em toda regra', () => {
    Object.values(TAX_RULES).forEach((r) => expect(r.source).toMatch(/^https:\/\//));
  });
});
