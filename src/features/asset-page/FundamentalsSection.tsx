import { DataSourceBadge } from '@/components/market/DataSourceBadge';
import { MetricCard } from '@/components/market/MetricCard';
import { unavailableText } from '@/components/market/unavailable';
import type { DataResult, Fundamentals } from '@/lib/data/types';
import { FUNDAMENTALS_META } from './fundamentals-meta';

export function FundamentalsSection({ fundamentals }: { fundamentals: DataResult<Fundamentals> }) {
  return (
    <section aria-labelledby="fundamentos-titulo" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="fundamentos-titulo" className="text-xl font-extrabold text-text">
          Indicadores fundamentalistas
        </h2>
        {fundamentals.status === 'ok' ? (
          <DataSourceBadge meta={fundamentals.meta} />
        ) : (
          <span className="text-xs text-muted">{unavailableText(fundamentals.reason)}</span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FUNDAMENTALS_META.map((m) => (
          <MetricCard
            key={m.key}
            label={m.label}
            format={m.format}
            help={{ text: m.help, ...(m.articleHref ? { href: m.articleHref } : {}) }}
            result={
              fundamentals.status === 'ok'
                ? { status: 'ok', data: fundamentals.data[m.key], meta: fundamentals.meta }
                : fundamentals
            }
          />
        ))}
      </div>
    </section>
  );
}
