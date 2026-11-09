'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Adorned, Field, Input, Select } from '@/components/ui';
import { INFLATION_UNAVAILABLE_NOTE } from '@/features/simulators-shared/inflation-default';
import { inflationUrlValue } from '@/features/simulators-shared/inflation-input';
import { CompoundInterestResult } from './CompoundInterestResult';
import { toSearchParams, validateValues, type FormValues } from './url-state';

const DEBOUNCE_MS = 300;

export function CompoundInterestForm({
  initial,
  inflationNote = INFLATION_UNAVAILABLE_NOTE,
  defaultInflation,
}: {
  initial: FormValues;
  /** Fonte e referência do padrão de inflação (ou aviso de indisponibilidade). */
  inflationNote?: string;
  /** Padrão do servidor (IPCA 12 meses, % pt-BR); a URL só grava `inflacao` se o campo diferir dele. */
  defaultInflation?: string;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const validation = useMemo(() => validateValues(values), [values]);
  const input = validation.input;
  const errors = validation.errors ?? {};
  const unidade = values.unidade;
  const { inflation, inflationError } = validation;

  const lastQuery = useRef<string | null>(null);
  if (lastQuery.current === null) {
    const first = validateValues(initial).input;
    lastQuery.current = first
      ? toSearchParams(
          first,
          initial.unidade,
          inflationUrlValue(initial.inflacao, defaultInflation),
        ).toString()
      : '';
  }

  useEffect(() => {
    if (!input || inflationError) return;
    const query = toSearchParams(
      input,
      unidade,
      inflationUrlValue(values.inflacao, defaultInflation),
    ).toString();
    if (query === lastQuery.current) return;
    const handle = setTimeout(() => {
      lastQuery.current = query;
      window.history.replaceState(null, '', `?${query}`);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [input, unidade, values.inflacao, defaultInflation, inflationError]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <form
        noValidate
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4 rounded-xl border border-line bg-surface p-4"
      >
        {errors.form && (
          <p role="alert" className="text-sm font-semibold text-down">
            {errors.form}
          </p>
        )}
        <Field label="Capital inicial" error={errors.capital}>
          {(p) => (
            <Adorned prefix="R$">
              <Input
                {...p}
                inputMode="decimal"
                className="pl-10"
                value={values.capital}
                onChange={(e) => set('capital', e.target.value)}
              />
            </Adorned>
          )}
        </Field>
        <Field label="Aporte mensal" error={errors.aporte}>
          {(p) => (
            <Adorned prefix="R$">
              <Input
                {...p}
                inputMode="decimal"
                className="pl-10"
                value={values.aporte}
                onChange={(e) => set('aporte', e.target.value)}
              />
            </Adorned>
          )}
        </Field>
        <Field label="Taxa de juros" error={errors.taxa}>
          {(p) => (
            <Adorned suffix="%">
              <Input
                {...p}
                inputMode="decimal"
                className="pr-9"
                value={values.taxa}
                onChange={(e) => set('taxa', e.target.value)}
              />
            </Adorned>
          )}
        </Field>
        <Field label="Período da taxa">
          {(p) => (
            <Select
              {...p}
              value={values.periodo}
              onChange={(e) => set('periodo', e.target.value as FormValues['periodo'])}
            >
              <option value="mes">Ao mês</option>
              <option value="ano">Ao ano</option>
            </Select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prazo" error={errors.prazo} hint={validation.notes.prazo}>
            {(p) => (
              <Input
                {...p}
                inputMode="decimal"
                value={values.prazo}
                onChange={(e) => set('prazo', e.target.value)}
              />
            )}
          </Field>
          <Field label="Unidade do prazo">
            {(p) => (
              <Select
                {...p}
                value={values.unidade}
                onChange={(e) => set('unidade', e.target.value as FormValues['unidade'])}
              >
                <option value="meses">Meses</option>
                <option value="anos">Anos</option>
              </Select>
            )}
          </Field>
        </div>
        <Field
          label="Inflação anual esperada (premissa)"
          error={inflationError}
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
      <div className="min-w-0 space-y-4">
        <CompoundInterestResult input={input ?? null} inflation={inflation} />
        <p className="text-xs text-muted">
          Valores nominais, sem descontar a inflação, exceto onde indicado &ldquo;em reais de
          hoje&rdquo;. Aporte considerado no fim de cada mês.
        </p>
      </div>
    </div>
  );
}
