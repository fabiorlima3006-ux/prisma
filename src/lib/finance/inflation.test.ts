import { describe, expect, it } from 'vitest';
import ipcaFixture from '@/lib/data/providers/__fixtures__/bcb-ipca-history.json';
import type { MonthlyPoint } from '@/lib/data/types';
import {
  correctByIpca,
  correctionInputSchema,
  futureInputSchema,
  INFLATION_MAX,
  INFLATION_MIN,
  purchasingPower,
  realRate,
  REAL_START_MONTH,
  toPresentValue,
} from './inflation';

type FixtureRow = { data: string; valor: string };

/** Converte a fixture do BCB (dd/MM/yyyy, valor em %) em MonthlyPoint (YYYY-MM, fração). */
function fixtureToSeries(rows: FixtureRow[]): MonthlyPoint[] {
  return rows.map((row) => {
    const [, mm, yyyy] = row.data.split('/');
    return { month: `${yyyy}-${mm}`, value: Number(row.valor) / 100 };
  });
}

const ipca2024 = fixtureToSeries(ipcaFixture as FixtureRow[]);

describe('toPresentValue', () => {
  it('desconta a inflação de um período', () => {
    expect(toPresentValue(110, 0.1, 1)).toBeCloseTo(100, 10);
  });

  it('sem inflação o valor não muda', () => {
    expect(toPresentValue(100, 0, 5)).toBeCloseTo(100, 10);
  });

  it('deflação aumenta o valor presente', () => {
    expect(toPresentValue(98, -0.02, 1)).toBeCloseTo(100, 10);
  });
});

describe('realRate', () => {
  it('calcula a taxa real pela fórmula de Fisher', () => {
    expect(realRate(0.1, 0.04)).toBeCloseTo(0.0576923, 6);
  });
});

describe('constantes', () => {
  it('expõe o início da série real e os limites de inflação', () => {
    expect(REAL_START_MONTH).toBe('1994-07');
    expect(INFLATION_MIN).toBe(-0.5);
    expect(INFLATION_MAX).toBe(1);
  });
});

describe('correctByIpca', () => {
  it('multiplica (1+v) dos meses após "from" até "to", inclusive', () => {
    const r = correctByIpca(ipca2024, 1000, '2024-01', '2024-04');
    const value = (m: string) => ipca2024.find((p) => p.month === m)!.value;
    const expected = (1 + value('2024-02')) * (1 + value('2024-03')) * (1 + value('2024-04'));

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.factor).toBeCloseTo(expected, 12);
    expect(r.corrected).toBeCloseTo(1000 * expected, 9);
    expect(r.accumulated).toBeCloseTo(expected - 1, 12);
    expect(r.months).toBe(3);
  });

  it('mesmo mês em from e to dá fator 1 e zero meses', () => {
    const r = correctByIpca(ipca2024, 500, '2024-03', '2024-03');
    expect(r).toEqual({ ok: true, corrected: 500, factor: 1, accumulated: 0, months: 0 });
  });

  it('retorna "order" quando from é depois de to', () => {
    expect(correctByIpca(ipca2024, 1000, '2024-05', '2024-02')).toEqual({
      ok: false,
      error: 'order',
    });
  });

  it('retorna "range" quando to é depois do último mês da série', () => {
    expect(correctByIpca(ipca2024, 1000, '2024-01', '2025-01')).toEqual({
      ok: false,
      error: 'range',
    });
  });

  it('retorna "range" quando from é anterior a REAL_START_MONTH', () => {
    expect(correctByIpca(ipca2024, 1000, '1994-06', '2024-03')).toEqual({
      ok: false,
      error: 'range',
    });
  });

  it('retorna "missing" quando algum mês do intervalo não está na série', () => {
    const semFevereiro = ipca2024.filter((p) => p.month !== '2024-02');
    expect(correctByIpca(semFevereiro, 1000, '2024-01', '2024-04')).toEqual({
      ok: false,
      error: 'missing',
    });
  });
});

describe('purchasingPower', () => {
  it('calcula o valor futuro e o equivalente de hoje', () => {
    const r = purchasingPower(1000, 0.05, 2);
    expect(r.neededInFuture).toBeCloseTo(1102.5, 10);
    expect(r.todayEquivalent).toBeCloseTo(907.03, 2);
  });
});

describe('correctionInputSchema', () => {
  it('aceita valor positivo e meses YYYY-MM', () => {
    expect(
      correctionInputSchema.safeParse({ amount: 1000, from: '2024-01', to: '2024-04' }).success,
    ).toBe(true);
  });

  it('rejeita valor não positivo e mês inválido, com as mensagens do formulário', () => {
    const r = correctionInputSchema.safeParse({ amount: 0, from: '2024-13', to: '2024-4' });
    expect(r.success).toBe(false);
    const msgs = r.error?.issues.map((i) => i.message);
    expect(msgs).toContain('Informe um valor maior que zero');
    expect(msgs).toContain('Use o formato MM/aaaa, com mês de 01 a 12');
  });
});

describe('futureInputSchema', () => {
  const base = { amount: 1000, inflation: 0.05 };

  it('aceita anos inteiros de 1 a 50', () => {
    expect(futureInputSchema.safeParse({ ...base, years: 1 }).success).toBe(true);
    expect(futureInputSchema.safeParse({ ...base, years: 50 }).success).toBe(true);
  });

  it.each([0, 0.5, 2.5, 51])('rejeita %s anos', (years) => {
    const r = futureInputSchema.safeParse({ ...base, years });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('Informe um prazo entre 1 e 50 anos');
  });

  it('rejeita inflação fora de -50% a 100% e valor não positivo', () => {
    expect(futureInputSchema.safeParse({ ...base, years: 2, inflation: 1.5 }).success).toBe(false);
    expect(futureInputSchema.safeParse({ ...base, years: 2, inflation: -0.6 }).success).toBe(false);
    expect(futureInputSchema.safeParse({ ...base, years: 2, amount: -1 }).success).toBe(false);
  });
});
