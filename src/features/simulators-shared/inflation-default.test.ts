import { describe, expect, it } from 'vitest';
import type { DataResult, IndicatorValue } from '@/lib/data/types';
import { inflationDefault } from './inflation-default';

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
      note: 'IPCA 12 meses, ref. 09/2026 (premissa, não previsão)',
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
