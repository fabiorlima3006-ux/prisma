import { DataSourceBadge } from '@/components/market/DataSourceBadge';
import { MetricCard } from '@/components/market/MetricCard';
import { RangeBar } from '@/components/market/RangeBar';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { Card } from '@/components/ui';
import type {
  Asset,
  DataResult,
  Fundamentals,
  HistoryRange,
  PricePoint,
  Quote,
} from '@/lib/data/types';
import { AssetHeader } from './AssetHeader';
import { FundamentalsSection } from './FundamentalsSection';
import { HistoryChart } from './HistoryChart';
import { RISK_TEXTS } from './risk-texts';
import { RiskSection } from './RiskSection';

const h2 = 'text-xl font-extrabold text-text';

function isRiskClass(c: Asset['class']): c is keyof typeof RISK_TEXTS {
  return c in RISK_TEXTS;
}

function Placeholder({ title }: { title: string }) {
  return (
    <Card as="section">
      <h3 className="text-sm font-bold text-text">{title}</h3>
      <p className="mt-1 text-sm">Previsto na Fase 2</p>
    </Card>
  );
}

export function AssetPage({
  asset,
  quote,
  history,
  fundamentals,
}: {
  asset: Asset;
  quote: DataResult<Quote>;
  history: Record<HistoryRange, DataResult<PricePoint[]>>;
  fundamentals: DataResult<Fundamentals>;
}) {
  const hasFundamentals = asset.class === 'stock' || asset.class === 'fii';
  const q = quote.status === 'ok' ? quote.data : null;
  const variations: [string, number | null][] = [
    ['Variação na semana', q?.change.week ?? null],
    ['Variação no mês', q?.change.month ?? null],
    ['Variação no ano', q?.change.year ?? null],
  ];
  return (
    <>
      <AssetHeader asset={asset} quote={quote} />
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6">
        <section aria-labelledby="variacao-titulo" className="space-y-3">
          <h2 id="variacao-titulo" className={h2}>
            Variação e faixa de preço
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {variations.map(([label, value]) => (
              <MetricCard
                key={label}
                label={label}
                format="percent"
                result={
                  quote.status === 'ok' ? { status: 'ok', data: value, meta: quote.meta } : quote
                }
              />
            ))}
          </div>
          <Card>
            <RangeBar
              label="Faixa de 52 semanas"
              low={q?.low52w ?? null}
              high={q?.high52w ?? null}
              current={q?.price ?? null}
            />
          </Card>
        </section>

        <section aria-labelledby="historico-titulo" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="historico-titulo" className={h2}>
              Histórico de preço
            </h2>
            {history['1m'].status === 'ok' && <DataSourceBadge meta={history['1m'].meta} />}
          </div>
          <HistoryChart history={history} currency={asset.currency} ticker={asset.ticker} />
        </section>

        {hasFundamentals && <FundamentalsSection fundamentals={fundamentals} />}

        {isRiskClass(asset.class) && <RiskSection assetClass={asset.class} />}

        <section aria-labelledby="extras-titulo" className="space-y-3">
          <h2 id="extras-titulo" className={h2}>
            Em breve
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {asset.class !== 'crypto' && <Placeholder title="Dividendos" />}
            <Placeholder title="Notícias" />
            <Placeholder title="Eventos" />
          </div>
        </section>

        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
