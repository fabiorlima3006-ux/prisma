import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata } from '@/lib/seo/metadata';
import { websiteJsonLd } from '@/lib/seo/json-ld';
import { marketData } from '@/lib/data';
import { getAsset } from '@/lib/data/catalog';
import type { Asset, AssetClass } from '@/lib/data/types';
import {
  AssistantShowcase,
  FinalCta,
  HeroSection,
  HighlightsSection,
  MarketStrip,
  StatsStrip,
  ToolsSection,
  TracksSection,
  type HighlightItem,
} from '@/features/home/sections';

export const revalidate = 900;
export const metadata: Metadata = buildMetadata({
  title: 'Prisma — central de investimentos',
  absoluteTitle: true,
  description:
    'Acompanhe mercados, estude investimentos, analise ativos e simule cenários em uma só plataforma.',
  path: '/',
});

function need(cls: AssetClass, slug: string): Asset {
  const a = getAsset(cls, slug);
  if (!a) throw new Error(`Ativo ausente do catálogo: ${slug}`);
  return a;
}

export default async function Home() {
  const marketAssets = [need('index', 'ibov'), need('index', 'spx'), need('crypto', 'btc')];
  const highlightDefs: [Asset, string][] = [
    [need('stock', 'petr4'), '/acoes/petr4'],
    [need('fii', 'mxrf11'), '/fiis/mxrf11'],
    [need('etf', 'bova11'), '/etfs/bova11'],
    [need('crypto', 'btc'), '/cripto/btc'],
  ];
  const [bcb, market, highlights] = await Promise.all([
    Promise.all(
      ['selic', 'cdi', 'ipca12m', 'ptax'].map((id) =>
        marketData.getIndicator(id as 'selic' | 'cdi' | 'ipca12m' | 'ptax'),
      ),
    ),
    Promise.all(marketAssets.map((a) => marketData.getQuote(a))),
    Promise.all(
      highlightDefs.map(async ([asset, href]): Promise<HighlightItem> => ({
        asset,
        href,
        quote: await marketData.getQuote(asset),
      })),
    ),
  ]);
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <HeroSection />
      <MarketStrip bcb={bcb} market={market} />
      <StatsStrip />
      <HighlightsSection items={highlights} />
      <ToolsSection />
      <TracksSection />
      <AssistantShowcase />
      <FinalCta />
    </>
  );
}
