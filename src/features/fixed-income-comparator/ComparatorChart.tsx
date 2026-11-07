'use client';

import { BarChart } from '@/components/charts';
import { formatCurrency } from '@/lib/format';
import { PRODUCT_META, type ComparisonRow } from '@/lib/finance/fixed-income';

/** Valor líquido apenas das linhas disponíveis. */
export function ComparatorChart({ rows }: { rows: ComparisonRow[] }) {
  const data = rows.flatMap((r) =>
    r.available ? [{ label: PRODUCT_META[r.product].label, value: r.net }] : [],
  );
  if (data.length === 0) return null;
  return (
    <BarChart
      data={data}
      title="Gráfico: valor líquido ao final do prazo, por produto"
      labelHeader="Produto"
      description="Valor líquido de imposto e custos, por produto disponível para este prazo."
      formatValue={formatCurrency}
    />
  );
}
