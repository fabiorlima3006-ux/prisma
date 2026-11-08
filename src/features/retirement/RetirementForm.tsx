'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Adorned, Field, Input } from '@/components/ui';
import { RetirementResult } from './RetirementResult';
import { toSearchParams, validateValues, type FormValues } from './url-state';

const DEBOUNCE_MS = 300;

export function RetirementForm({ initial }: { initial: FormValues }) {
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
        className="space-y-4 rounded-xl border border-line bg-surface p-4"
      >
        {errors.form && (
          <p role="alert" className="text-sm font-semibold text-down">
            {errors.form}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Idade atual" error={errors.idade}>
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                value={values.idade}
                onChange={(e) => set('idade', e.target.value)}
              />
            )}
          </Field>
          <Field label="Idade-alvo (opcional)" error={errors.alvo}>
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                value={values.alvo}
                onChange={(e) => set('alvo', e.target.value)}
              />
            )}
          </Field>
        </div>
        <Field label="Patrimônio atual" error={errors.patrimonio}>
          {(p) => (
            <Adorned prefix="R$">
              <Input
                {...p}
                inputMode="decimal"
                className="pl-10"
                value={values.patrimonio}
                onChange={(e) => set('patrimonio', e.target.value)}
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
        <Field label="Renda mensal desejada" error={errors.renda}>
          {(p) => (
            <Adorned prefix="R$">
              <Input
                {...p}
                inputMode="decimal"
                className="pl-10"
                value={values.renda}
                onChange={(e) => set('renda', e.target.value)}
              />
            </Adorned>
          )}
        </Field>
        <Field
          label="Rentabilidade real anual (premissa)"
          error={errors.real}
          hint="Valor ilustrativo, não é dado de mercado nem previsão: o retorno real futuro é incerto."
        >
          {(p) => (
            <Adorned suffix="%">
              <Input
                {...p}
                inputMode="decimal"
                className="pr-9"
                value={values.real}
                onChange={(e) => set('real', e.target.value)}
              />
            </Adorned>
          )}
        </Field>
      </form>
      <div className="min-w-0">
        <RetirementResult input={input ?? null} />
      </div>
    </div>
  );
}
