'use client';

import { useMemo } from 'react';
import { Adorned, Field, Input } from '@/components/ui';
import type { MonthlyPoint } from '@/lib/data/types';
import { correctByIpca, REAL_START_MONTH } from '@/lib/finance/inflation';
import { formatCurrency, formatNumber, formatPercent, parseBrNumber } from '@/lib/format';
import { monthLabel, parseMonthYear, type CorrectionValues } from './url-state';

const FORMAT_ERROR = 'Use o formato MM/aaaa, com mês de 01 a 12';

export type CorrectionState = {
  errors: Partial<Record<'valor' | 'de' | 'ate' | 'form', string>>;
  /** Entradas válidas, para escrever a URL. */
  parsed?: { valor: number; de: string; ate: string };
  result?: { corrected: number; factor: number; accumulated: number; months: number };
};

export function evaluateCorrection(series: MonthlyPoint[], v: CorrectionValues): CorrectionState {
  const errors: CorrectionState['errors'] = {};
  const valor = parseBrNumber(v.valor);
  if (valor === null || valor <= 0) errors.valor = 'Informe um valor maior que zero';
  const de = parseMonthYear(v.de);
  const ate = parseMonthYear(v.ate);
  if (de === null) errors.de = FORMAT_ERROR;
  if (ate === null) errors.ate = FORMAT_ERROR;
  if (valor === null || valor <= 0 || de === null || ate === null) return { errors };

  const result = correctByIpca(series, valor, de, ate);
  if (!result.ok) {
    if (result.error === 'order') {
      errors.form = 'O mês final deve ser igual ou posterior ao inicial';
    } else if (result.error === 'range') {
      const last = series.reduce((max, p) => (p.month > max ? p.month : max), '');
      errors.form = `Período fora da série disponível (${monthLabel(REAL_START_MONTH)} a ${monthLabel(last)})`;
    } else {
      errors.form = 'Há meses sem dado de IPCA neste período';
    }
    return { errors };
  }
  return { errors, parsed: { valor, de: v.de.trim(), ate: v.ate.trim() }, result };
}

export function CorrectionForm({
  series,
  values,
  onChange,
}: {
  series: MonthlyPoint[];
  values: CorrectionValues;
  onChange: (next: CorrectionValues) => void;
}) {
  const { errors, result } = useMemo(() => evaluateCorrection(series, values), [series, values]);
  const set = (key: keyof CorrectionValues, value: string) => onChange({ ...values, [key]: value });

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <form
        noValidate
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4 rounded-xl border border-line bg-surface p-4"
      >
        <Field label="Valor a corrigir" error={errors.valor}>
          {(p) => (
            <Adorned prefix="R$">
              <Input
                {...p}
                inputMode="decimal"
                className="pl-10"
                value={values.valor}
                onChange={(e) => set('valor', e.target.value)}
              />
            </Adorned>
          )}
        </Field>
        <Field label="Mês inicial (MM/aaaa)" error={errors.de}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              placeholder="MM/aaaa"
              value={values.de}
              onChange={(e) => set('de', e.target.value)}
            />
          )}
        </Field>
        <Field label="Mês final (MM/aaaa)" error={errors.ate}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              placeholder="MM/aaaa"
              value={values.ate}
              onChange={(e) => set('ate', e.target.value)}
            />
          )}
        </Field>
        <p className="text-xs text-muted">
          Considera o IPCA dos meses seguintes ao mês inicial até o mês final, inclusive.
        </p>
      </form>
      <div className="min-w-0 space-y-4" aria-live="polite">
        {errors.form && (
          <p role="alert" className="text-sm font-semibold text-down">
            {errors.form}
          </p>
        )}
        {result && (
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm text-muted">Valor corrigido pelo IPCA</p>
            <p data-testid="corrected-value" className="font-mono text-3xl font-bold text-text">
              {formatCurrency(result.corrected)}
            </p>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted">Fator de correção</dt>
                <dd data-testid="correction-factor" className="font-mono font-semibold">
                  {formatNumber(result.factor, 6)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">IPCA acumulado</dt>
                <dd className="font-mono font-semibold">
                  {formatPercent(result.accumulated, { signed: true })}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Período</dt>
                <dd className="font-mono font-semibold">
                  {result.months} {result.months === 1 ? 'mês' : 'meses'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
