'use client';

// Sem sincronização com a URL: o comparador recalcula localmente (debounce de 300 ms).
import { useEffect, useMemo, useState } from 'react';
import { DataSourceBadge } from '@/components/market/DataSourceBadge';
import { referenceLabel } from '@/components/market/indicator-labels';
import { Adorned, Badge, Button, Field, Input } from '@/components/ui';
import type { TaxRules } from '@/lib/config/tax-rules';
import type { DataResult, IndicatorValue } from '@/lib/data/types';
import {
  compareFixedIncome,
  comparatorInputSchema,
  type ComparatorInput,
} from '@/lib/finance/fixed-income';
import { formatDate, formatNumber, formatPercent, parseBrNumber } from '@/lib/format';
import { ComparatorChart } from './ComparatorChart';
import { ComparatorTable } from './ComparatorTable';

const DEBOUNCE_MS = 300;

type Rates = {
  cdi: DataResult<IndicatorValue>;
  selic: DataResult<IndicatorValue>;
  tr: DataResult<IndicatorValue>;
};

type Values = {
  amount: string;
  days: string;
  cdbPct: string;
  lciPct: string;
  cdi: string;
  selic: string;
  tr: string;
};
type Key = keyof Values;

function pctText(r: DataResult<IndicatorValue>): string {
  return r.status === 'ok' ? formatNumber(r.data.value * 100, 2) : '';
}

const FIELD_OF_PATH: Record<string, Key> = {
  amount: 'amount',
  calendarDays: 'days',
  cdbPctCdi: 'cdbPct',
  lciLcaPctCdi: 'lciPct',
  cdiAnnual: 'cdi',
  selicAnnual: 'selic',
  trMonthly: 'tr',
};

function validate(values: Values, manual: boolean, rates: Rates) {
  const pct = (s: string) => {
    const n = parseBrNumber(s);
    return n === null ? null : n / 100;
  };
  const rate = (k: 'cdi' | 'selic' | 'tr', r: DataResult<IndicatorValue>) =>
    manual ? pct(values[k]) : r.status === 'ok' ? r.data.value : null;
  const candidate = {
    amount: parseBrNumber(values.amount),
    calendarDays: parseBrNumber(values.days),
    cdbPctCdi: pct(values.cdbPct),
    lciLcaPctCdi: pct(values.lciPct),
    rates: {
      cdiAnnual: rate('cdi', rates.cdi),
      selicAnnual: rate('selic', rates.selic),
      trMonthly: rate('tr', rates.tr),
    },
  };
  const parsed = comparatorInputSchema.safeParse(candidate);
  if (parsed.success) {
    return { input: parsed.data as ComparatorInput, errors: {} as Partial<Record<Key, string>> };
  }
  const errors: Partial<Record<Key, string>> = {};
  for (const issue of parsed.error.issues) {
    const key = FIELD_OF_PATH[String(issue.path[issue.path.length - 1])];
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { input: null, errors };
}

export function ComparatorForm({ rates, rules }: { rates: Rates; rules: TaxRules }) {
  const allOk =
    rates.cdi.status === 'ok' && rates.selic.status === 'ok' && rates.tr.status === 'ok';
  const trUnavailable = rates.tr.status !== 'ok';
  const [manualChosen, setManualChosen] = useState(false);
  const manual = !allOk || manualChosen;
  const [values, setValues] = useState<Values>({
    amount: '10.000',
    days: '365',
    cdbPct: '100',
    lciPct: '90',
    cdi: pctText(rates.cdi),
    selic: pctText(rates.selic),
    tr: rates.tr.status === 'ok' ? pctText(rates.tr) : '0',
  });
  const set = (key: Key, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const { input, errors } = useMemo(() => validate(values, manual, rates), [values, manual, rates]);

  // Validação é imediata; só o cálculo dos resultados é debounced.
  const [debounced, setDebounced] = useState<ComparatorInput | null>(input);
  useEffect(() => {
    if (!input) return;
    const handle = setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [input]);

  const rows = useMemo(
    () => (input && debounced ? compareFixedIncome(debounced, rules) : null),
    [input, debounced, rules],
  );

  const numberField = (key: Key, label: string, opts: { prefix?: string; suffix?: string }) => (
    <Field label={label} error={errors[key]}>
      {(p) => (
        <Adorned {...opts}>
          <Input
            {...p}
            inputMode="decimal"
            className={opts.prefix ? 'pl-10' : 'pr-9'}
            value={values[key]}
            onChange={(e) => set(key, e.target.value)}
          />
        </Adorned>
      )}
    </Field>
  );

  const readOnly: [string, DataResult<IndicatorValue>][] = [
    ['CDI', rates.cdi],
    ['Selic meta', rates.selic],
    ['TR', rates.tr],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <form
        noValidate
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4 rounded-xl border border-line bg-surface p-4"
      >
        {numberField('amount', 'Valor', { prefix: 'R$' })}
        <Field label="Prazo (dias)" error={errors.days}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              value={values.days}
              onChange={(e) => set('days', e.target.value)}
            />
          )}
        </Field>
        {numberField('cdbPct', '% do CDI do CDB', { suffix: '%' })}
        {numberField('lciPct', '% do CDI da LCI/LCA', { suffix: '%' })}

        <fieldset className="space-y-3 border-t border-line pt-4">
          <legend className="sr-only">Taxas de mercado</legend>
          {manual ? (
            <>
              <Badge tone="neutral">Taxas informadas pelo usuário</Badge>
              {numberField('cdi', 'CDI (% a.a.)', { suffix: '%' })}
              {numberField('selic', 'Selic meta (% a.a.)', { suffix: '%' })}
              {numberField('tr', 'TR (% a.m.)', { suffix: '%' })}
              {trUnavailable && (
                <p className="text-xs text-muted">TR indisponível; considerada 0</p>
              )}
            </>
          ) : (
            <dl className="space-y-3">
              {readOnly.map(([name, r]) =>
                r.status === 'ok' ? (
                  <div key={name} className="space-y-1">
                    <dt className="text-sm font-semibold text-text">{name}</dt>
                    <dd className="space-y-1">
                      <span className="font-mono text-sm">
                        {formatPercent(r.data.value)} {r.data.unit}
                      </span>{' '}
                      <span className="text-xs text-muted">{referenceLabel(r.data)}</span>
                      <span className="block">
                        <DataSourceBadge meta={r.meta} />
                      </span>
                    </dd>
                  </div>
                ) : null,
              )}
            </dl>
          )}
          {allOk && (
            <Button type="button" onClick={() => setManualChosen((m) => !m)}>
              {manualChosen ? 'Usar taxas de mercado' : 'Informar taxas manualmente'}
            </Button>
          )}
        </fieldset>
      </form>

      <div className="min-w-0 space-y-4">
        {rows ? (
          <>
            <ComparatorTable rows={rows} />
            <ComparatorChart rows={rows} />
          </>
        ) : (
          <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
            Corrija os campos destacados para ver a comparação.
          </p>
        )}
        <Assumptions rules={rules} />
      </div>
    </div>
  );
}

function oldestVerified(rules: TaxRules): string | null {
  const dates = [
    rules.incomeTaxBrackets.verifiedAt,
    rules.lciLca.verifiedAt,
    rules.lciLca.verification.lci.verifiedAt,
    rules.lciLca.verification.lca.verifiedAt,
    rules.tesouroCustody.verifiedAt,
    rules.savings.verifiedAt,
  ];
  if (dates.some((d) => d === null)) return null;
  const oldest = (dates as string[]).slice().sort()[0];
  return oldest ? formatDate(oldest) : null;
}

function Assumptions({ rules }: { rules: TaxRules }) {
  const verified = oldestVerified(rules);
  const sources: [string, string][] = [
    ['Imposto de renda', rules.incomeTaxBrackets.source],
    ['LCI/LCA', rules.lciLca.source],
    ['Custódia do Tesouro', rules.tesouroCustody.source],
    ['Poupança', rules.savings.source],
  ];
  return (
    <section aria-labelledby="premissas" className="space-y-2 text-sm text-muted">
      <h2 id="premissas" className="text-sm font-bold text-text">
        Premissas
      </h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Dias úteis ≈ dias corridos × 252/365</li>
        <li>Prazo mínimo de 30 dias; IOF não se aplica</li>
        <li>Tesouro Selic sem ágio/deságio</li>
        <li>% do CDI na convenção diária de mercado</li>
        <li>Regras tributárias vigentes em {verified ?? 'não verificadas'}</li>
      </ul>
      <p className="text-xs">
        Fontes:{' '}
        {sources.map(([label, href], i) => (
          <span key={label}>
            {i > 0 && ' · '}
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
              {label}
            </a>
          </span>
        ))}
      </p>
    </section>
  );
}
