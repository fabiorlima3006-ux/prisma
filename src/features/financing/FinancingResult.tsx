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

const YEARLY_COLUMNS: TableColumn[] = [
  { key: 'year', label: 'Ano' },
  { key: 'paid', label: 'Pago no ano', align: 'right' },
  { key: 'interest', label: 'Juros', align: 'right' },
  { key: 'amortization', label: 'Amortização', align: 'right' },
  { key: 'balance', label: 'Saldo final', align: 'right' },
];

const MONTHLY_COLUMNS: TableColumn[] = [
  { key: 'month', label: 'Mês' },
  { key: 'installment', label: 'Parcela', align: 'right' },
  { key: 'interest', label: 'Juros', align: 'right' },
  { key: 'amortization', label: 'Amortização', align: 'right' },
  { key: 'balance', label: 'Saldo', align: 'right' },
];

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

function SystemColumn({
  system,
  name,
  result,
  savings,
}: {
  system: SystemKey;
  name: string;
  result: SystemResult;
  savings: Savings | null;
}) {
  const installments = result.rows.map((r) => ({
    label: `Mês ${r.month}`,
    value: r.installment,
  }));
  const monthly = result.rows.map((r) => ({
    month: String(r.month),
    installment: formatCurrency(r.installment),
    interest: formatCurrency(r.interest),
    amortization: formatCurrency(r.amortization + r.extra),
    balance: formatCurrency(r.balance),
  }));
  return (
    <section aria-labelledby={`${system}-title`} className="min-w-0 space-y-4">
      <h2 id={`${system}-title`} className="text-lg font-bold text-text">
        {name}
      </h2>
      <Card>
        <dl className="divide-y divide-line">
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
        description={`Parcela mensal ao longo do prazo, sistema ${name}.`}
        labelHeader="Mês"
        data={installments}
        formatValue={(v) => formatCurrency(v)}
      />
      <Table
        caption={`Resumo anual, sistema ${name}`}
        columns={YEARLY_COLUMNS}
        rows={yearlyRows(result)}
      />
      <details className="rounded-xl border border-line bg-surface">
        <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-semibold text-text">
          Tabela mensal ({name})
        </summary>
        <div className="max-h-96 overflow-y-auto">
          <Table
            caption={`Parcelas mês a mês, sistema ${name}`}
            columns={MONTHLY_COLUMNS}
            rows={monthly}
          />
        </div>
      </details>
    </section>
  );
}

export function FinancingResult({ input }: { input: FinancingInput | null }) {
  if (!input) {
    return (
      <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        Corrija os campos destacados para ver o resultado da simulação.
      </p>
    );
  }
  const { sac, price, savings } = compareSystems(input);
  return (
    <div className="space-y-4">
      <div aria-live="polite" className="grid gap-6 sm:grid-cols-2">
        <SystemColumn system="sac" name="SAC" result={sac} savings={savings?.sac ?? null} />
        <SystemColumn system="price" name="Price" result={price} savings={savings?.price ?? null} />
      </div>
      <p className="text-sm text-text">{SYSTEM_TEXT}</p>
      <p className="text-xs text-muted">{SCOPE_TEXT}</p>
    </div>
  );
}
