'use client';

import { AreaChart } from '@/components/charts';
import { unavailableText } from '@/components/market/unavailable';
import { Tabs } from '@/components/ui';
import type { DataResult, HistoryRange, PricePoint } from '@/lib/data/types';
import { formatCurrency } from '@/lib/format';

const RANGES: { id: HistoryRange; label: string; title: string }[] = [
  { id: '1m', label: '1M', title: 'último mês' },
  { id: '6m', label: '6M', title: 'últimos 6 meses' },
  { id: '1y', label: '1A', title: 'último ano' },
];

export function HistoryChart({
  history,
  currency,
  ticker,
}: {
  history: Record<HistoryRange, DataResult<PricePoint[]>>;
  currency: 'BRL' | 'USD';
  ticker: string;
}) {
  const items = RANGES.map((r) => {
    const result = history[r.id];
    return {
      id: r.id,
      label: r.label,
      content:
        result.status === 'ok' && result.data.length > 0 ? (
          <AreaChart
            title={`Histórico de preço de ${ticker}, ${r.title}`}
            data={result.data.map((p) => ({ label: p.date, value: p.close }))}
            formatValue={(v) => formatCurrency(v, currency)}
          />
        ) : (
          <p className="text-sm text-muted">
            {result.status === 'unavailable'
              ? unavailableText(result.reason)
              : 'Dado não disponível'}
          </p>
        ),
    };
  });
  return <Tabs items={items} />;
}
