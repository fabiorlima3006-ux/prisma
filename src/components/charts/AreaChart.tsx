'use client';

import dynamic from 'next/dynamic';
import { ChartFrame, ChartLoading } from './ChartFrame';
import type { ChartProps } from './types';

const Impl = dynamic(() => import('./recharts-impl').then((m) => m.AreaChartImpl), {
  ssr: false,
  loading: () => <ChartLoading />,
});

export function AreaChart(props: ChartProps) {
  return (
    <ChartFrame {...props}>
      <Impl {...props} />
    </ChartFrame>
  );
}
