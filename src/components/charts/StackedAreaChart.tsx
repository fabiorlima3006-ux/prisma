'use client';

import dynamic from 'next/dynamic';
import { ChartLoading } from './ChartFrame';
import type { StackedAreaChartProps } from './types';

const Impl = dynamic(() => import('./recharts-impl').then((m) => m.StackedAreaChartImpl), {
  ssr: false,
  loading: () => <ChartLoading />,
});

/** Área empilhada (total investido + juros) com tabela equivalente só para leitores de tela. */
export function StackedAreaChart(props: StackedAreaChartProps) {
  const fmt = props.formatValue ?? ((v: number) => String(v));
  return (
    <figure aria-label={props.title} className="m-0">
      <div aria-hidden="true" className="h-64 w-full">
        <Impl {...props} />
      </div>
      <p aria-hidden="true" className="mt-2 flex gap-4 text-xs text-muted">
        <span>
          <span className="mr-1 inline-block size-2 rounded-sm bg-muted" />
          Total investido
        </span>
        <span>
          <span className="mr-1 inline-block size-2 rounded-sm bg-accent" />
          Juros acumulados
        </span>
      </p>
      <table className="sr-only">
        <caption>{props.title}</caption>
        <thead>
          <tr>
            <th scope="col">Período</th>
            <th scope="col">Total investido</th>
            <th scope="col">Juros acumulados</th>
          </tr>
        </thead>
        <tbody>
          {props.data.map((p, i) => (
            <tr key={i}>
              <td>{p.label}</td>
              <td>{fmt(p.invested)}</td>
              <td>{fmt(p.interest)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
