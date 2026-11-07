import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Asset, DataMeta, DataResult, IndicatorValue, Quote } from '@/lib/data/types';
import { AssetCard } from './AssetCard';
import { DataSourceBadge } from './DataSourceBadge';
import { INDICATOR_LABELS } from './indicator-labels';
import { IndicatorStrip } from './IndicatorStrip';
import { MetricCard } from './MetricCard';
import { PriceChange } from './PriceChange';
import { RangeBar } from './RangeBar';

const demoMeta: DataMeta = {
  source: 'demo',
  isDemo: true,
  asOf: '2026-11-07T12:00:00Z',
  attribution: 'x',
};
const bcbMeta: DataMeta = {
  source: 'bcb',
  isDemo: false,
  asOf: '2026-11-07T12:00:00Z',
  attribution: 'Banco Central do Brasil — SGS',
};

const selic = (meta: DataMeta): DataResult<IndicatorValue> => ({
  status: 'ok',
  data: { id: 'selic', value: 0.105, unit: 'a.a.', referenceDate: '2026-11-07' },
  meta,
});
const unavailable: DataResult<IndicatorValue> = {
  status: 'unavailable',
  reason: 'fetch-failed',
  source: 'bcb',
  attribution: 'x',
};
const quote: Quote = {
  price: 38.5,
  change: { day: 0.0123, week: null, month: null, year: null },
  volume: null,
  dayHigh: null,
  dayLow: null,
  high52w: null,
  low52w: null,
};
const asset: Asset = {
  ticker: 'PETR4',
  slug: 'petr4',
  name: 'Petrobras PN',
  class: 'stock',
  market: 'BR',
  currency: 'BRL',
};

describe('DataSourceBadge', () => {
  it('mostra selo demonstrativo', () => {
    render(<DataSourceBadge meta={demoMeta} />);
    expect(screen.getByText('DADOS DEMONSTRATIVOS')).toBeInTheDocument();
  });
  it('mostra fonte real', () => {
    render(<DataSourceBadge meta={bcbMeta} />);
    expect(screen.getByText(/Banco Central do Brasil — SGS/)).toBeInTheDocument();
    expect(screen.queryByText('DADOS DEMONSTRATIVOS')).toBeNull();
  });
});

describe('MetricCard', () => {
  it('not-provided', () => {
    render(
      <MetricCard
        label="P/L"
        result={{ status: 'unavailable', reason: 'not-provided', source: 'demo', attribution: 'x' }}
        format="ratio"
      />,
    );
    expect(screen.getByText('Dado não disponível')).toBeInTheDocument();
  });
  it('ok com data null', () => {
    render(
      <MetricCard
        label="ROE"
        result={{ status: 'ok', data: null, meta: demoMeta }}
        format="percent"
      />,
    );
    expect(screen.getByText('Dado não disponível')).toBeInTheDocument();
  });
  it('not-applicable', () => {
    render(
      <MetricCard
        label="P/L"
        result={{
          status: 'not-applicable',
          reason: 'A empresa teve prejuízo nos últimos 12 meses.',
        }}
        format="ratio"
      />,
    );
    expect(screen.getByText('Não se aplica')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Por que não se aplica?' })).toBeInTheDocument();
  });
  it('fetch-failed', () => {
    render(
      <MetricCard
        label="Selic"
        result={{ status: 'unavailable', reason: 'fetch-failed', source: 'bcb', attribution: 'x' }}
        format="percent"
      />,
    );
    expect(screen.getByText('Dado indisponível no momento')).toBeInTheDocument();
  });
  it('formata valores e marca demo', () => {
    const { container } = render(
      <MetricCard
        label="P/L"
        result={{ status: 'ok', data: 12.345, meta: demoMeta }}
        format="ratio"
      />,
    );
    expect(screen.getByText('12,35x')).toBeInTheDocument();
    expect(container.querySelector('[data-demo-value]')).not.toBeNull();
  });
});

describe('PriceChange', () => {
  it('alta', () => {
    render(<PriceChange value={0.0123} />);
    expect(screen.getByText('▲ +1,23%')).toBeInTheDocument();
  });
  it('queda', () => {
    render(<PriceChange value={-0.004} />);
    expect(screen.getByText('▼ -0,40%')).toBeInTheDocument();
  });
  it('null', () => {
    render(<PriceChange value={null} />);
    expect(screen.getByText('Dado não disponível')).toBeInTheDocument();
  });
});

describe('RangeBar', () => {
  it('tem role img e aria-label', () => {
    render(<RangeBar low={10} high={20} current={15} label="52 semanas" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/Mínima .*máxima .*atual /);
  });
  it('com null mostra texto', () => {
    render(<RangeBar low={null} high={20} current={15} label="52 semanas" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Dado não disponível')).toBeInTheDocument();
  });
});

describe('AssetCard', () => {
  it('ok: link, preço, grupo demo', () => {
    const { container } = render(
      <AssetCard
        asset={asset}
        quote={{ status: 'ok', data: quote, meta: demoMeta }}
        href="/acoes/petr4"
      />,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/acoes/petr4');
    expect(screen.getByText('PETR4')).toBeInTheDocument();
    expect(screen.getByText('▲ +1,23%')).toBeInTheDocument();
    expect(screen.getByText('DADOS DEMONSTRATIVOS')).toBeInTheDocument();
    const group = container.querySelector('[data-source-group="demo"]');
    expect(group).not.toBeNull();
    expect(group?.querySelector('[data-demo-value]')).not.toBeNull();
  });
  it('unavailable', () => {
    render(
      <AssetCard
        asset={asset}
        quote={{ status: 'unavailable', reason: 'fetch-failed', source: 'brapi', attribution: 'x' }}
        href="/acoes/petr4"
      />,
    );
    expect(screen.getByText('Dado indisponível no momento')).toBeInTheDocument();
  });
});

describe('IndicatorStrip', () => {
  it('labels', () => {
    expect(INDICATOR_LABELS.ipca12m).toBe('IPCA 12m');
    expect(INDICATOR_LABELS.ptax).toBe('Dólar PTAX');
  });
  it('grupo demo com selo e data-demo-value', () => {
    const { container } = render(
      <IndicatorStrip groups={[{ results: [selic(demoMeta)], labels: ['Selic'] }]} />,
    );
    const group = container.querySelector('[data-source-group="demo"]') as HTMLElement;
    expect(within(group).getByText('DADOS DEMONSTRATIVOS')).toBeInTheDocument();
    expect(within(group).getByText('10,50% a.a.')).toBeInTheDocument();
    expect(group.querySelector('[data-demo-value]')).not.toBeNull();
  });
  it('grupo real tem fonte e sem demo', () => {
    const { container } = render(
      <IndicatorStrip groups={[{ results: [selic(bcbMeta)], labels: ['Selic'] }]} />,
    );
    const group = container.querySelector('[data-source-group="bcb"]') as HTMLElement;
    expect(within(group).getByText(/Banco Central do Brasil — SGS/)).toBeInTheDocument();
    expect(group.querySelector('[data-demo-value]')).toBeNull();
  });
  it('grupo misto e quote', () => {
    const q: DataResult<Quote> = { status: 'ok', data: quote, meta: demoMeta };
    const { container } = render(
      <IndicatorStrip groups={[{ results: [selic(bcbMeta), q], labels: ['Selic', 'PETR4'] }]} />,
    );
    const group = container.querySelector('[data-source-group="mixed"]') as HTMLElement;
    expect(within(group).getByText('DADOS DEMONSTRATIVOS')).toBeInTheDocument();
    expect(within(group).getByText('▲ +1,23%')).toBeInTheDocument();
  });
  it('grupo todo indisponível: sem selo', () => {
    render(
      <IndicatorStrip
        groups={[{ results: [unavailable, unavailable], labels: ['Selic', 'CDI'] }]}
      />,
    );
    expect(screen.getAllByText('Dado indisponível no momento')).toHaveLength(2);
    expect(screen.queryByText('DADOS DEMONSTRATIVOS')).toBeNull();
    expect(screen.queryByText(/Fonte:/)).toBeNull();
  });
});
