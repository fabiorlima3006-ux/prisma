import { DataSourceBadge } from '@/components/market/DataSourceBadge';
import { PriceChange } from '@/components/market/PriceChange';
import { unavailableText } from '@/components/market/unavailable';
import { PageHeader } from '@/components/layout/PageHeader';
import type { Asset, DataResult, Quote } from '@/lib/data/types';
import { formatCurrency } from '@/lib/format';
import { CLASS_LABELS, CLASS_PATHS } from './class-info';

export function AssetHeader({ asset, quote }: { asset: Asset; quote: DataResult<Quote> }) {
  const listHref = CLASS_PATHS[asset.class];
  return (
    <>
      <PageHeader
        eyebrow={CLASS_LABELS[asset.class].toLowerCase()}
        title={asset.ticker}
        description={asset.name}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: CLASS_LABELS[asset.class], ...(listHref ? { href: listHref } : {}) },
          { label: asset.ticker },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
        {quote.status === 'ok' ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span
              className="font-mono text-3xl font-bold text-text"
              {...(quote.meta.isDemo ? { 'data-demo-value': '' } : {})}
            >
              {formatCurrency(quote.data.price, asset.currency)}
            </span>
            <span className="text-base">
              <PriceChange value={quote.data.change.day} />
            </span>
            <DataSourceBadge meta={quote.meta} />
          </div>
        ) : (
          <p className="text-base text-muted">{unavailableText(quote.reason)}</p>
        )}
      </div>
    </>
  );
}
