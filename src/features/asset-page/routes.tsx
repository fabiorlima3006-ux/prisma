import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { AssetCard } from '@/components/market/AssetCard';
import { marketData } from '@/lib/data';
import { getAsset, listByClass } from '@/lib/data/catalog';
import type { AssetClass } from '@/lib/data/types';
import { AssetPage } from './AssetPage';
import { CLASS_PATHS } from './class-info';

type SlugProps = { params: Promise<{ slug: string }> };

export function makeAssetRoute(assetClass: AssetClass) {
  return {
    generateStaticParams() {
      return listByClass(assetClass).map((a) => ({ slug: a.slug }));
    },
    async generateMetadata({ params }: SlugProps): Promise<Metadata> {
      const { slug } = await params;
      const asset = getAsset(assetClass, slug.toLowerCase());
      return asset ? { title: `${asset.ticker} — ${asset.name}` } : {};
    },
    async Page({ params }: SlugProps) {
      const { slug } = await params;
      if (slug !== slug.toLowerCase())
        permanentRedirect(`${CLASS_PATHS[assetClass]}/${slug.toLowerCase()}`);
      const asset = getAsset(assetClass, slug);
      if (!asset) notFound();
      const [quote, h1m, h6m, h1y, fundamentals] = await Promise.all([
        marketData.getQuote(asset),
        marketData.getHistory(asset, '1m'),
        marketData.getHistory(asset, '6m'),
        marketData.getHistory(asset, '1y'),
        marketData.getFundamentals(asset),
      ]);
      return (
        <AssetPage
          asset={asset}
          quote={quote}
          history={{ '1m': h1m, '6m': h6m, '1y': h1y }}
          fundamentals={fundamentals}
        />
      );
    },
  };
}

export function makeClassListPage(assetClass: AssetClass, title: string, description: string) {
  const segment = CLASS_PATHS[assetClass];
  return async function ClassListPage() {
    const items = await Promise.all(
      listByClass(assetClass).map(async (asset) => ({
        asset,
        quote: await marketData.getQuote(asset),
      })),
    );
    return (
      <>
        <PageHeader
          eyebrow="mercados"
          title={title}
          description={description}
          breadcrumbs={[{ label: 'Início', href: '/' }, { label: title }]}
        />
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ asset, quote }) => (
              <AssetCard
                key={asset.slug}
                asset={asset}
                quote={quote}
                href={`${segment}/${asset.slug}`}
              />
            ))}
          </div>
          <Disclaimer variant="prominent" />
        </div>
      </>
    );
  };
}
