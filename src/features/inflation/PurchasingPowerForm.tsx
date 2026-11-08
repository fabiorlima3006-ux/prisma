'use client';

import { useMemo } from 'react';
import { Adorned, Field, Input } from '@/components/ui';
import { parseInflation } from '@/features/simulators-shared/inflation-input';
import { futureInputSchema, purchasingPower } from '@/lib/finance/inflation';
import { formatCurrency, formatNumber, parseBrNumber } from '@/lib/format';
import type { FutureValues } from './url-state';

const REQUIRED = 'Informe um número válido';

export type FutureState = {
  errors: Partial<Record<'valor' | 'anos' | 'inflacao', string>>;
  parsed?: { valor: number; anos: number; inflation: number };
  result?: { neededInFuture: number; todayEquivalent: number };
};

export function evaluateFuture(v: FutureValues): FutureState {
  const errors: FutureState['errors'] = {};
  const amount = parseBrNumber(v.valor);
  const years = parseBrNumber(v.anos);
  const { inflation, inflationError } = parseInflation(v.inflacao);
  const parsed = futureInputSchema.safeParse({
    amount: amount ?? undefined,
    years: years ?? undefined,
    inflation: inflation ?? undefined,
  });
  if (!parsed.success) {
    const keys = { amount: 'valor', years: 'anos', inflation: 'inflacao' } as const;
    for (const issue of parsed.error.issues) {
      const key = keys[issue.path[0] as keyof typeof keys];
      if (key) errors[key] ??= issue.message;
    }
    if (years === null) errors.anos = REQUIRED;
    if (v.inflacao.trim() === '') errors.inflacao = 'Informe uma premissa de inflação';
    else if (inflationError) errors.inflacao = inflationError;
    return { errors };
  }
  const { amount: valor, years: anos, inflation: infl } = parsed.data;
  return {
    errors,
    parsed: { valor, anos, inflation: infl },
    result: purchasingPower(valor, infl, anos),
  };
}

export function PurchasingPowerForm({
  values,
  inflationNote,
  onChange,
}: {
  values: FutureValues;
  inflationNote: string;
  onChange: (next: FutureValues) => void;
}) {
  const { errors, parsed, result } = useMemo(() => evaluateFuture(values), [values]);
  const set = (key: keyof FutureValues, value: string) => onChange({ ...values, [key]: value });

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <form
        noValidate
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4 rounded-xl border border-line bg-surface p-4"
      >
        <Field label="Valor de hoje" error={errors.valor}>
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
        <Field label="Prazo (anos)" error={errors.anos}>
          {(p) => (
            <Input
              {...p}
              inputMode="decimal"
              value={values.anos}
              onChange={(e) => set('anos', e.target.value)}
            />
          )}
        </Field>
        <Field
          label="Inflação anual esperada (premissa)"
          error={errors.inflacao}
          hint={inflationNote}
        >
          {(p) => (
            <Adorned suffix="%">
              <Input
                {...p}
                inputMode="decimal"
                className="pr-9"
                value={values.inflacao}
                onChange={(e) => set('inflacao', e.target.value)}
              />
            </Adorned>
          )}
        </Field>
      </form>
      <div className="min-w-0 space-y-4" aria-live="polite">
        {result && parsed && (
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm text-muted">
              Com inflação de {formatNumber(parsed.inflation * 100)}% ao ano (premissa, não
              previsão), durante {formatNumber(parsed.anos, Number.isInteger(parsed.anos) ? 0 : 2)}{' '}
              {parsed.anos === 1 ? 'ano' : 'anos'}:
            </p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">
                  Para manter o poder de compra de {formatCurrency(parsed.valor)} de hoje, seria
                  preciso no futuro
                </dt>
                <dd data-testid="needed-future" className="font-mono text-2xl font-bold">
                  {formatCurrency(result.neededInFuture)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">
                  {formatCurrency(parsed.valor)} no futuro equivalem, em reais de hoje, a
                </dt>
                <dd data-testid="today-equivalent" className="font-mono text-2xl font-bold">
                  {formatCurrency(result.todayEquivalent)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
