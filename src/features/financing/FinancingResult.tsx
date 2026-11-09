'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { AreaChart } from '@/components/charts';
import { Card, Table, type TableColumn } from '@/components/ui';
import {
  compareSystems,
  type FinancingInput,
  type FinancingResult as SystemResult,
} from '@/lib/finance/financing';
import { formatCurrency } from '@/lib/format';

const SYSTEM_TEXT =
  'No SAC as parcelas começam maiores e diminuem; os juros totais tendem a ser menores. Na Price as parcelas são iguais; os juros totais tendem a ser maiores.';
const SCOPE_TEXT =
  'Seguros, taxas administrativas, correção pela TR, IOF e CET não estão incluídos; a parcela real do contrato será diferente.';

type SystemKey = 'sac' | 'price';
type Savings = { interest: number; months: number };

/** A coluna anual soma a amortização regular e o extra; o rótulo avisa quando há extra. */
function yearlyColumns(withExtra: boolean): TableColumn[] {
  return [
    { key: 'year', label: 'Ano' },
    { key: 'paid', label: 'Pago no ano', align: 'right' },
    { key: 'interest', label: 'Juros', align: 'right' },
    {
      key: 'amortization',
      label: withExtra ? 'Amortização (inclui extra)' : 'Amortização',
      align: 'right',
    },
    { key: 'balance', label: 'Saldo final', align: 'right' },
  ];
}

function monthlyColumns(withExtra: boolean): TableColumn[] {
  return [
    { key: 'month', label: 'Mês' },
    { key: 'installment', label: 'Parcela', align: 'right' },
    { key: 'interest', label: 'Juros', align: 'right' },
    { key: 'amortization', label: 'Amortização', align: 'right' },
    ...(withExtra
      ? ([
          { key: 'extra', label: 'Extra', align: 'right' },
          { key: 'paid', label: 'Pago no mês', align: 'right' },
        ] as TableColumn[])
      : []),
    { key: 'balance', label: 'Saldo', align: 'right' },
  ];
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function yearlyRows(result: SystemResult) {
  const years = new Map<
    number,
    { paid: number; interest: number; amortization: number; balance: number }
  >();
  for (const r of result.rows) {
    const year = Math.ceil(r.month / 12);
    const acc = years.get(year) ?? { paid: 0, interest: 0, amortization: 0, balance: 0 };
    acc.paid += r.installment + r.extra;
    acc.interest += r.interest;
    acc.amortization += r.amortization + r.extra;
    acc.balance = r.balance;
    years.set(year, acc);
  }
  return [...years.entries()].map(([year, a]) => ({
    year: String(year),
    paid: formatCurrency(a.paid),
    interest: formatCurrency(a.interest),
    amortization: formatCurrency(a.amortization),
    balance: formatCurrency(a.balance),
  }));
}

function Row({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-xs">{label}</dt>
      <dd data-testid={testId} className="text-right font-mono text-sm font-bold text-text">
        {value}
      </dd>
    </div>
  );
}

/** Montada só depois da primeira abertura do <details>; some do caminho de cada digitação. */
function MonthlyTable({
  name,
  result,
  withExtra,
}: {
  name: string;
  result: SystemResult;
  withExtra: boolean;
}) {
  const rows = useMemo(
    () =>
      result.rows.map((r) => ({
        month: String(r.month),
        installment: formatCurrency(r.installment),
        interest: formatCurrency(r.interest),
        amortization: formatCurrency(r.amortization),
        extra: formatCurrency(r.extra),
        paid: formatCurrency(r.installment + r.extra),
        balance: formatCurrency(r.balance),
      })),
    [result],
  );
  return (
    <Table
      caption={`Parcelas mês a mês, sistema ${name}`}
      columns={monthlyColumns(withExtra)}
      rows={rows}
    />
  );
}

function SystemColumn({
  system,
  name,
  result,
  savings,
  withExtra,
}: {
  system: SystemKey;
  name: string;
  result: SystemResult;
  savings: Savings | null;
  withExtra: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const installments = useMemo(
    () =>
      result.rows
        .filter((r, i) => r.month % 12 === 0 || i === result.rows.length - 1)
        .map((r) => ({ label: `Ano ${Math.ceil(r.month / 12)}`, value: r.installment })),
    [result],
  );
  const yearly = useMemo(() => yearlyRows(result), [result]);
  return (
    <section aria-labelledby={`${system}-title`} className="min-w-0 space-y-4">
      <h2 id={`${system}-title`} className="text-lg font-bold text-text">
        {name}
      </h2>
      <Card>
        <dl aria-live="polite" className="divide-y divide-line">
          <Row
            label="Primeira parcela"
            value={formatCurrency(result.firstInstallment)}
            testId={`${system}-first`}
          />
          <Row
            label="Última parcela"
            value={formatCurrency(result.lastInstallment)}
            testId={`${system}-last`}
          />
          <Row
            label="Total pago"
            value={formatCurrency(result.totalPaid)}
            testId={`${system}-total-paid`}
          />
          <Row
            label="Total de juros"
            value={formatCurrency(result.totalInterest)}
            testId={`${system}-total-interest`}
          />
          <Row
            label="Número de parcelas"
            value={String(result.months)}
            testId={`${system}-months`}
          />
          {savings && (
            <>
              <Row
                label="Economia de juros"
                value={formatCurrency(savings.interest)}
                testId={`${system}-saving-interest`}
              />
              <Row
                label="Economia de prazo"
                value={plural(savings.months, 'mês', 'meses')}
                testId={`${system}-saving-months`}
              />
            </>
          )}
        </dl>
      </Card>
      <AreaChart
        title={`Evolução da parcela no ${name}`}
        description={`Parcela ao fim de cada ano, sistema ${name}.`}
        labelHeader="Ano"
        data={installments}
        formatValue={(v) => formatCurrency(v)}
      />
      <Table
        caption={`Resumo anual, sistema ${name}`}
        columns={yearlyColumns(withExtra)}
        rows={yearly}
      />
      <details
        className="rounded-xl border border-line bg-surface"
        onToggle={(e) => {
          if (e.currentTarget.open) setOpened(true);
        }}
      >
        <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-semibold text-text">
          Tabela mensal ({name})
        </summary>
        <div className="max-h-96 overflow-y-auto">
          {opened && <MonthlyTable name={name} result={result} withExtra={withExtra} />}
        </div>
      </details>
    </section>
  );
}

export function FinancingResult({ input }: { input: FinancingInput | null }) {
  const deferred = useDeferredValue(input);
  const compared = useMemo(() => (deferred ? compareSystems(deferred) : null), [deferred]);
  if (!input || !deferred || !compared) {
    return (
      <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        Corrija os campos destacados para ver o resultado da simulação.
      </p>
    );
  }
  const { sac, price, savings } = compared;
  const withExtra = deferred.extraMonthly > 0;
  return (
    <div className="space-y-4">
      <div className="grid gap-6 sm:grid-cols-2">
        <SystemColumn
          system="sac"
          name="SAC"
          result={sac}
          savings={savings?.sac ?? null}
          withExtra={withExtra}
        />
        <SystemColumn
          system="price"
          name="Price"
          result={price}
          savings={savings?.price ?? null}
          withExtra={withExtra}
        />
      </div>
      <p className="text-sm text-text">{SYSTEM_TEXT}</p>
      <p className="text-xs text-muted">{SCOPE_TEXT}</p>
    </div>
  );
}
