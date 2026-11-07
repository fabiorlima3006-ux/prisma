import Link from 'next/link';
import { Card } from '@/components/ui';
import type { Asset, DataResult, Quote } from '@/lib/data/types';
import { formatCurrency } from '@/lib/format';
import { DataSourceBadge } from './DataSourceBadge';
import { PriceChange } from './PriceChange';
import { unavailableText } from './unavailable';

export function AssetCard({
  asset,
  quote,
  href,
}: {
  asset: Asset;
  quote: DataResult<Quote>;
  href: string;
}) {
  const group = quote.status === 'ok' ? quote.meta.source : quote.source;
  const demo = quote.status === 'ok' && quote.meta.isDemo;
  return (
    <Card as="article" interactive data-source-group={group}>
      <Link href={href} className="block no-underline">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-sm font-bold text-text">{asset.ticker}</span>
          <span className="truncate text-xs">{asset.name}</span>
        </div>
        {quote.status === 'ok' ? (
          <>
            <div
              className="mt-2 flex items-baseline justify-between"
              {...(demo ? { 'data-demo-value': '' } : {})}
            >
              <span className="font-mono text-lg font-bold text-text">
                {formatCurrency(quote.data.price, asset.currency)}
              </span>
              <PriceChange value={quote.data.change.day} />
            </div>
            <div className="mt-2">
              <DataSourceBadge meta={quote.meta} />
            </div>
          </>
        ) : (
          <div className="mt-2 text-sm">{unavailableText(quote.reason)}</div>
        )}
      </Link>
    </Card>
  );
}
