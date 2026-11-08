import type { Metadata } from 'next';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { InflationSimulator } from '@/features/inflation/InflationSimulator';
import { fromSearchParams } from '@/features/inflation/url-state';
import {
  inflationDefault,
  INFLATION_UNAVAILABLE_NOTE,
} from '@/features/simulators-shared/inflation-default';
import { marketData } from '@/lib/data';
import { REAL_START_MONTH } from '@/lib/finance/inflation';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Simulador de inflação',
  description:
    'Corrija valores pelo IPCA real e veja o efeito da inflação sobre o poder de compra.',
  path: '/simuladores/inflacao',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function InflacaoPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) sp.set(key, first);
  }
  const [history, ipca12m] = await Promise.all([
    marketData.getIndicatorHistory('ipcaMonth', REAL_START_MONTH),
    marketData.getIndicator('ipca12m'),
  ]);
  const series = history.status === 'ok' && history.data.length > 0 ? history.data : null;
  const lastMonth = series ? series.reduce((max, p) => (p.month > max ? p.month : max), '') : null;
  const fallback = inflationDefault(ipca12m);
  const { tab, correction, future } = fromSearchParams(sp, {
    lastMonth,
    defaultInflacao: fallback?.percent ?? '',
  });
  return (
    <>
      <PageHeader
        eyebrow="simuladores"
        title="Simulador de inflação"
        description="Corrija valores pelo IPCA real e veja o efeito da inflação sobre o poder de compra."
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Simuladores', href: '/simuladores' },
          { label: 'Inflação' },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <InflationSimulator
          series={series}
          meta={history.status === 'ok' ? history.meta : null}
          initialTab={tab}
          correction={correction}
          future={future}
          inflationNote={fallback?.note ?? INFLATION_UNAVAILABLE_NOTE}
        />
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
