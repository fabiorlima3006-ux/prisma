import type { Metadata } from 'next';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { INDICATOR_LABELS } from '@/components/market/indicator-labels';
import { IndicatorStrip } from '@/components/market/IndicatorStrip';
import { Tabs } from '@/components/ui';
import { MarketsTable, type MarketRow } from '@/features/markets/MarketsTables';
import { marketData } from '@/lib/data';
import { CATALOG, getAsset } from '@/lib/data/catalog';
import type { Asset, AssetClass, IndicatorId } from '@/lib/data/types';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 900;
export const metadata: Metadata = buildMetadata({
  title: 'Mercados',
  description:
    'Cotações e indicadores do Brasil, do exterior e de criptomoedas, com a fonte de cada dado.',
  path: '/mercados',
});

const INDICATORS: IndicatorId[] = ['selic', 'cdi', 'ipca12m', 'ipcaMonth', 'ptax', 'tr'];

function pick(...refs: [AssetClass, string][]): Asset[] {
  return refs.flatMap(([cls, slug]) => {
    const a = getAsset(cls, slug);
    return a ? [a] : [];
  });
}

async function rowsFor(assets: Asset[]): Promise<MarketRow[]> {
  return Promise.all(
    assets.map(async (asset) => ({ asset, quote: await marketData.getQuote(asset) })),
  );
}

export default async function MercadosPage() {
  const brAssets = [
    ...CATALOG.filter((a) => a.class === 'stock'),
    ...CATALOG.filter((a) => a.class === 'fii'),
    ...CATALOG.filter((a) => a.class === 'etf'),
    ...pick(['index', 'ibov']),
  ];
  const [bcb, br, world, crypto] = await Promise.all([
    Promise.all(INDICATORS.map((id) => marketData.getIndicator(id))),
    rowsFor(brAssets),
    rowsFor(pick(['index', 'spx'], ['index', 'ndx'], ['index', 'dji'])),
    rowsFor(pick(['crypto', 'btc'], ['crypto', 'eth'])),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="mercados"
        title="Mercados"
        description="Cotações e indicadores do Brasil, do exterior e do mercado de criptomoedas, sempre com a fonte de cada dado."
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: 'Mercados' }]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <Tabs
          items={[
            {
              id: 'brasil',
              label: 'Brasil',
              content: (
                <div className="space-y-4">
                  <IndicatorStrip
                    groups={[
                      { results: bcb, labels: INDICATORS.map((id) => INDICATOR_LABELS[id]) },
                    ]}
                  />
                  <MarketsTable caption="Mercado brasileiro" rows={br} phase2={['Juros futuros']} />
                </div>
              ),
            },
            {
              id: 'exterior',
              label: 'Exterior',
              content: (
                <MarketsTable
                  caption="Mercado exterior"
                  rows={world}
                  phase2={['Treasuries', 'Commodities']}
                />
              ),
            },
            {
              id: 'cripto',
              label: 'Cripto',
              content: (
                <MarketsTable caption="Criptomoedas" rows={crypto} phase2={['Dominância cripto']} />
              ),
            },
          ]}
        />
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
