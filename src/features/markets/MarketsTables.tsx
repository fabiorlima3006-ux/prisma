import Link from 'next/link';
import type { ReactNode } from 'react';
import { DataSourceBadge } from '@/components/market/DataSourceBadge';
import { PriceChange } from '@/components/market/PriceChange';
import { unavailableText } from '@/components/market/unavailable';
import { Table, type TableColumn } from '@/components/ui';
import { assetHref } from '@/features/asset-page/class-info';
import type { Asset, DataResult, Quote } from '@/lib/data/types';
import { formatCurrency, formatNumber } from '@/lib/format';

export const PHASE2_TEXT = 'Dado não disponível — previsto na Fase 2';

const columns: TableColumn[] = [
  { key: 'asset', label: 'Ativo' },
  { key: 'price', label: 'Preço', align: 'right' },
  { key: 'day', label: 'Dia', align: 'right' },
  { key: 'source', label: 'Fonte' },
];

export type MarketRow = { asset: Asset; quote: DataResult<Quote> };

function assetCell(asset: Asset): ReactNode {
  const href = assetHref(asset);
  const ticker = href ? (
    <Link href={href} className="font-mono font-bold">
      {asset.ticker}
    </Link>
  ) : (
    <span className="font-mono font-bold text-text">{asset.ticker}</span>
  );
  return (
    <>
      {ticker} <span className="text-muted">{asset.name}</span>
    </>
  );
}

function toRow({ asset, quote }: MarketRow): Record<string, ReactNode> {
  if (quote.status === 'unavailable') {
    return {
      asset: assetCell(asset),
      price: <span className="font-sans text-muted">{unavailableText(quote.reason)}</span>,
      day: '',
      source: '',
    };
  }
  const price =
    asset.class === 'index'
      ? `${formatNumber(quote.data.price)} pts`
      : formatCurrency(quote.data.price, asset.currency);
  return {
    asset: assetCell(asset),
    price: <span {...(quote.meta.isDemo ? { 'data-demo-value': '' } : {})}>{price}</span>,
    day: <PriceChange value={quote.data.change.day} />,
    source: <DataSourceBadge meta={quote.meta} />,
  };
}

export function MarketsTable({
  caption,
  rows,
  phase2,
}: {
  caption: string;
  rows: MarketRow[];
  phase2: string[];
}) {
  return (
    <Table
      caption={caption}
      columns={columns}
      rows={[
        ...rows.map(toRow),
        ...phase2.map((label) => ({
          asset: <span className="font-bold text-text">{label}</span>,
          price: <span className="font-sans text-muted">{PHASE2_TEXT}</span>,
          day: '',
          source: '',
        })),
      ]}
    />
  );
}
