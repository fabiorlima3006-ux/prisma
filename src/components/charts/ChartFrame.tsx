import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui';
import type { ChartProps } from './types';

export function ChartLoading() {
  return <Skeleton className="h-64 w-full" />;
}

/** Moldura comum: figura rotulada, gráfico decorativo e tabela equivalente só para leitores de tela. */
export function ChartFrame({
  data,
  title,
  description,
  formatValue,
  children,
}: ChartProps & { children: ReactNode }) {
  const fmt = formatValue ?? ((v: number) => String(v));
  return (
    <figure aria-label={title} className="m-0">
      {description && <figcaption className="mb-2 text-xs text-muted">{description}</figcaption>}
      <div aria-hidden="true" className="h-64 w-full">
        {children}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={i}>
              <td>{p.label}</td>
              <td>{fmt(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
