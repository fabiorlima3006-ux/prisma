import { Table } from '@/components/ui';
import type { MonthRow } from '@/lib/finance/compound-interest';
import { toPresentValue } from '@/lib/finance/inflation';
import { formatCurrency, formatNumber } from '@/lib/format';

/** Ano da linha em pt-BR: inteiro ("3") ou com uma casa quando o prazo não fecha o ano ("2,5"). */
export function yearLabel(month: number): string {
  return month % 12 === 0 ? String(month / 12) : formatNumber(month / 12, 1);
}

export function YearlyTable({
  rows,
  inflation = null,
}: {
  rows: MonthRow[];
  /** Inflação anual (fração): quando informada, acrescenta a coluna "Em reais de hoje". */
  inflation?: number | null;
}) {
  return (
    <details className="rounded-xl border border-line bg-surface p-3.5">
      <summary className="cursor-pointer text-sm font-semibold text-text">
        Ver tabela ano a ano
      </summary>
      <div className="mt-3">
        <Table
          caption="Evolução anual"
          columns={[
            { key: 'year', label: 'Ano' },
            { key: 'invested', label: 'Total investido', align: 'right' },
            { key: 'interest', label: 'Juros acumulados', align: 'right' },
            { key: 'balance', label: 'Patrimônio', align: 'right' },
            ...(inflation === null
              ? []
              : [{ key: 'real', label: 'Em reais de hoje', align: 'right' as const }]),
          ]}
          rows={rows.map((r) => ({
            year: yearLabel(r.month),
            invested: formatCurrency(r.invested),
            interest: formatCurrency(r.interest),
            balance: formatCurrency(r.balance),
            ...(inflation === null
              ? {}
              : { real: formatCurrency(toPresentValue(r.balance, inflation, r.month / 12)) }),
          }))}
        />
      </div>
    </details>
  );
}
