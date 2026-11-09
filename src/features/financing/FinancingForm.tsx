'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Adorned, Field, Input, Select } from '@/components/ui';
import { FinancingResult } from './FinancingResult';
import { toSearchParams, validateValues, type FormValues } from './url-state';

const DEBOUNCE_MS = 300;

export function FinancingForm({ initial }: { initial: FormValues }) {
  const [values, setValues] = useState<FormValues>(initial);
  const set = (key: keyof FormValues, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const validation = useMemo(() => validateValues(values), [values]);
  const input = validation.input;
  const errors = validation.errors ?? {};

  const lastQuery = useRef<string | null>(null);
  if (lastQuery.current === null) {
    const first = validateValues(initial).input;
    lastQuery.current = first ? toSearchParams(first).toString() : '';
  }

  // Nunca escreve a URL na montagem: só quando o resultado muda por ação da pessoa.
  useEffect(() => {
    if (!input) return;
    const query = toSearchParams(input).toString();
    if (query === lastQuery.current) return;
    const handle = setTimeout(() => {
      lastQuery.current = query;
      window.history.replaceState(null, '', `?${query}`);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [input]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <form
        noValidate
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4 rounded-xl border border-line bg-surface p-4 lg:self-start"
      >
        {errors.form && (
          <p role="alert" className="text-sm font-semibold text-down">
            {errors.form}
          </p>
        )}
        <Field label="Valor financiado" error={errors.valor}>
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
        <div className="grid grid-cols-2 gap-3">
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
          <Field label="Período da taxa" error={errors.periodo}>
            {(p) => (
              <Select
                {...p}
                value={values.periodo}
                onChange={(e) => set('periodo', e.target.value)}
              >
                <option value="mes">ao mês</option>
                <option value="ano">ao ano</option>
              </Select>
            )}
          </Field>
        </div>
        <Field label="Prazo (meses)" error={errors.prazo}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              value={values.prazo}
              onChange={(e) => set('prazo', e.target.value)}
            />
          )}
        </Field>
        <Field
          label="Amortização extra mensal"
          error={errors.extra}
          hint="Valor pago a mais todo mês, além da parcela. Use 0 para não simular."
        >
          {(p) => (
            <Adorned prefix="R$">
              <Input
                {...p}
                inputMode="decimal"
                className="pl-10"
                value={values.extra}
                onChange={(e) => set('extra', e.target.value)}
              />
            </Adorned>
          )}
        </Field>
      </form>
      <div className="min-w-0">
        <FinancingResult input={input ?? null} />
      </div>
    </div>
  );
}
