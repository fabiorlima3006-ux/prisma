import { Badge } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/lib/format';
import { highestNet, PRODUCT_META, type ComparisonRow } from '@/lib/finance/fixed-income';

const NUMERIC = [
  'Bruto',
  'Imposto',
  'Custos',
  'Líquido',
  'Rentab. líquida no período',
  'Equivalente a.a.',
];
const TEXT = ['Liquidez', 'Risco', 'FGC'];

export function ComparatorTable({ rows }: { rows: ComparisonRow[] }) {
  const top = highestNet(rows);
  const th = 'px-3.5 py-2 text-xs font-bold text-muted';
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <caption className="px-3.5 py-2.5 text-left font-mono text-xs text-muted">
          Comparação de renda fixa
        </caption>
        <thead>
          <tr className="bg-surface-2">
            <th scope="col" className={`${th} text-left`}>
              Produto
            </th>
            {NUMERIC.map((c) => (
              <th key={c} scope="col" className={`${th} text-right`}>
                {c}
              </th>
            ))}
            {TEXT.map((c) => (
              <th key={c} scope="col" className={`${th} text-left`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const meta = PRODUCT_META[r.product];
            const num = 'px-3.5 py-2 text-right font-mono tabular-nums text-text';
            const txt = 'px-3.5 py-2 text-left text-xs text-text';
            return (
              <tr key={r.product} className="border-t border-line align-top">
                <th scope="row" className="px-3.5 py-2 text-left font-semibold text-text">
                  <span>{meta.label}</span>
                  {r.available && r.product === top && (
                    <span className="mt-1 block">
                      <Badge tone="neutral">maior valor líquido nesta simulação</Badge>
                    </span>
                  )}
                </th>
                {r.available ? (
                  <>
                    <td className={num}>{formatCurrency(r.gross)}</td>
                    <td className={num}>{formatCurrency(r.tax)}</td>
                    <td className={num}>{formatCurrency(r.costs)}</td>
                    <td className={`${num} font-bold`}>{formatCurrency(r.net)}</td>
                    <td className={num}>{formatPercent(r.netReturn)}</td>
                    <td className={num}>{formatPercent(r.netReturnAnnualized)}</td>
                  </>
                ) : (
                  <td colSpan={NUMERIC.length} className="px-3.5 py-2 text-left text-muted">
                    {r.reason}
                  </td>
                )}
                <td className={txt}>{meta.liquidity}</td>
                <td className={txt}>{meta.risk}</td>
                <td className={txt}>{meta.fgc}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
