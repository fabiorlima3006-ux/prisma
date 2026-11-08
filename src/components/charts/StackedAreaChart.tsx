'use client';

import dynamic from 'next/dynamic';
import { ChartFrame, ChartLoading } from './ChartFrame';
import type { StackedAreaChartProps } from './types';

const Impl = dynamic(() => import('./recharts-impl').then((m) => m.StackedAreaChartImpl), {
  ssr: false,
  loading: () => <ChartLoading />,
});

const legend = (
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
);

/** Área empilhada (total investido + juros) com tabela equivalente só para leitores de tela. */
export function StackedAreaChart(props: StackedAreaChartProps) {
  const fmt = props.formatValue ?? ((v: number) => String(v));
  return (
    <ChartFrame
      title={props.title}
      legend={legend}
      table={{
        headers: ['Período', 'Total investido', 'Juros acumulados'],
        rows: props.data.map((p) => [p.label, fmt(p.invested), fmt(p.interest)]),
      }}
    >
      <Impl {...props} />
    </ChartFrame>
  );
}
