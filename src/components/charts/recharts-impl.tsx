'use client';

import type { ReactElement } from 'react';
import {
  Area,
  AreaChart as RAreaChart,
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartProps, StackedAreaChartProps } from './types';

const axis = { stroke: 'var(--muted)', fontSize: 11, tickLine: false } as const;

function Frame({ children }: { children: ReactElement }) {
  return (
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 256 }}>
      {children}
    </ResponsiveContainer>
  );
}

function Axes({ formatValue }: Pick<ChartProps, 'formatValue'>) {
  return (
    <>
      <CartesianGrid stroke="var(--line)" vertical={false} />
      <XAxis dataKey="label" minTickGap={32} {...axis} />
      <YAxis width={64} domain={['auto', 'auto']} tickFormatter={formatValue} {...axis} />
      <Tooltip
        formatter={(v) => (typeof v === 'number' && formatValue ? formatValue(v) : String(v))}
        contentStyle={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          fontSize: 12,
        }}
      />
    </>
  );
}

export function LineChartImpl({ data, formatValue }: ChartProps) {
  return (
    <Frame>
      <RLineChart data={data} accessibilityLayer={false}>
        <Axes formatValue={formatValue} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </RLineChart>
    </Frame>
  );
}

export function AreaChartImpl({ data, formatValue }: ChartProps) {
  return (
    <Frame>
      <RAreaChart data={data} accessibilityLayer={false}>
        <Axes formatValue={formatValue} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.15}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </RAreaChart>
    </Frame>
  );
}

export function BarChartImpl({ data, formatValue }: ChartProps) {
  return (
    <Frame>
      <RBarChart data={data} accessibilityLayer={false}>
        <Axes formatValue={formatValue} />
        <Bar dataKey="value" fill="var(--accent)" isAnimationActive={false} />
      </RBarChart>
    </Frame>
  );
}

export function StackedAreaChartImpl({ data, formatValue }: StackedAreaChartProps) {
  return (
    <Frame>
      <RAreaChart data={data} accessibilityLayer={false}>
        <Axes formatValue={formatValue} />
        <Area
          type="monotone"
          dataKey="invested"
          name="Total investido"
          stackId="1"
          stroke="var(--muted)"
          fill="var(--muted)"
          fillOpacity={0.3}
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="interest"
          name="Juros acumulados"
          stackId="1"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.35}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </RAreaChart>
    </Frame>
  );
}
