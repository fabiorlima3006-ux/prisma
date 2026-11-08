'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import type { ChartPoint } from './types';

export function ChartLoading() {
  return <Skeleton className="h-64 w-full" />;
}

type Common = {
  title: string;
  description?: string;
  /** Legenda visual (decorativa; a tabela sr-only já descreve as séries). */
  legend?: ReactNode;
  /** O gráfico (Recharts sob demanda). Só é montado perto da viewport. */
  children: ReactNode;
};
type SimpleTable = {
  data: ChartPoint[];
  formatValue?: (v: number) => string;
  labelHeader?: string;
  table?: undefined;
};
type CustomTable = { table: { headers: string[]; rows: string[][] }; data?: undefined };
export type ChartFrameProps = Common & (SimpleTable | CustomTable);

function tableOf(props: ChartFrameProps): { headers: string[]; rows: string[][] } {
  if (props.table) return props.table;
  const fmt = props.formatValue ?? ((v: number) => String(v));
  return {
    headers: [props.labelHeader ?? 'Data', 'Valor'],
    rows: props.data.map((p) => [p.label, fmt(p.value)]),
  };
}

/**
 * Moldura comum: figura rotulada, gráfico decorativo e tabela equivalente só para leitores de
 * tela. A tabela está sempre no HTML; o gráfico (e o download do Recharts) só começa quando a
 * figura chega a ~200 px da viewport. Até lá, um skeleton ocupa o mesmo espaço.
 */
export function ChartFrame(props: ChartFrameProps) {
  const { title, description, legend, children } = props;
  const [ref, inView] = useInViewOnce<HTMLDivElement>({ rootMargin: '200px', threshold: 0 });
  const { headers, rows } = tableOf(props);
  return (
    <figure aria-label={title} className="m-0">
      {description && <figcaption className="mb-2 text-xs text-muted">{description}</figcaption>}
      <div ref={ref} aria-hidden="true" className="h-64 w-full">
        {inView ? children : <ChartLoading />}
      </div>
      {legend}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
