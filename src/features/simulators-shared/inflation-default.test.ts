import { describe, expect, it } from 'vitest';
import type { DataResult, IndicatorValue } from '@/lib/data/types';
import { inflationDefault } from './inflation-default';
import { inflationUrlValue } from './inflation-input';

const ok: DataResult<IndicatorValue> = {
  status: 'ok',
  data: { id: 'ipca12m', value: 0.0458, unit: 'a.a.', referenceDate: '2026-09-01' },
  meta: {
    source: 'bcb',
    isDemo: false,
    asOf: '2026-09-01',
    attribution: 'Banco Central do Brasil',
  },
};

describe('inflationDefault', () => {
  it('usa o IPCA 12 meses real, com referência e rótulo de premissa', () => {
    expect(inflationDefault(ok)).toEqual({
      percent: '4,58',
      note: 'Padrão: IPCA 12 meses de 4,58% (ref. 09/2026); premissa, não previsão.',
    });
  });

  it('sem dado real devolve null (nunca valor demonstrativo)', () => {
    expect(
      inflationDefault({
        status: 'unavailable',
        reason: 'fetch-failed',
        source: 'bcb',
        attribution: 'Banco Central do Brasil',
      }),
    ).toBeNull();
  });
});

describe('inflationUrlValue', () => {
  it('igual ao padrão (como número) não grava; diferente grava', () => {
    expect(inflationUrlValue('4,58', '4,58')).toBeUndefined();
    expect(inflationUrlValue('4,580', '4,58')).toBeUndefined();
    expect(inflationUrlValue('5', '4,58')).toBeCloseTo(0.05);
    expect(inflationUrlValue('4,58', undefined)).toBeCloseTo(0.0458);
  });

  it('vazio: com padrão grava vazio (desligado); sem padrão não grava', () => {
    expect(inflationUrlValue('', '4,58')).toBeNull();
    expect(inflationUrlValue('', undefined)).toBeUndefined();
  });

  it('ilegível ou fora do intervalo não grava', () => {
    expect(inflationUrlValue('abc', '4,58')).toBeUndefined();
    expect(inflationUrlValue('150', '4,58')).toBeUndefined();
  });
});
