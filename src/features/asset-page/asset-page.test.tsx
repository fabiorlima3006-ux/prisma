import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getAsset } from '@/lib/data/catalog';
import type {
  Asset,
  DataMeta,
  DataResult,
  HistoryRange,
  PricePoint,
  Quote,
} from '@/lib/data/types';
import { AssetPage } from './AssetPage';
import { FUNDAMENTALS_META } from './fundamentals-meta';
import { RISK_TEXTS } from './risk-texts';

const meta: DataMeta = {
  source: 'demo',
  isDemo: true,
  asOf: '2026-11-07T12:00:00Z',
  attribution: 'demo',
};
const quote: DataResult<Quote> = {
  status: 'ok',
  meta,
  data: {
    price: 38.5,
    change: { day: 0.012, week: -0.004, month: 0.03, year: 0.2 },
    volume: 1000,
    dayHigh: 39,
    dayLow: 38,
    high52w: 45,
    low52w: 30,
  },
};
const points: PricePoint[] = [
  { date: '2026-10-01', close: 36 },
  { date: '2026-10-02', close: 37 },
];
const histories: Record<HistoryRange, DataResult<PricePoint[]>> = {
  '1m': { status: 'ok', meta, data: points },
  '6m': { status: 'ok', meta, data: points },
  '1y': { status: 'unavailable', reason: 'not-provided', source: 'demo', attribution: 'x' },
};
const noFundamentals: DataResult<never> = {
  status: 'unavailable',
  reason: 'not-provided',
  source: 'demo',
  attribution: 'x',
};

function need(cls: Asset['class'], slug: string): Asset {
  const a = getAsset(cls, slug);
  if (!a) throw new Error(slug);
  return a;
}

describe('AssetPage', () => {
  it('ação: H1, 11 indicadores indisponíveis, selo demo e aviso', () => {
    render(
      <AssetPage
        asset={need('stock', 'petr4')}
        quote={quote}
        history={histories}
        fundamentals={noFundamentals}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PETR4');
    expect(screen.getAllByText('Dado não disponível').length).toBeGreaterThanOrEqual(11);
    expect(screen.getAllByText('DADOS DEMONSTRATIVOS').length).toBeGreaterThan(0);
    expect(screen.getByText(/finalidade educacional/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Indicadores fundamentalistas/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Riscos desta classe/ })).toBeInTheDocument();
  });

  it('tabela acessível do histórico e placeholders da Fase 2', () => {
    render(
      <AssetPage
        asset={need('stock', 'petr4')}
        quote={quote}
        history={histories}
        fundamentals={noFundamentals}
      />,
    );
    expect(screen.getAllByText('2026-10-01').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Previsto na Fase 2/).length).toBeGreaterThanOrEqual(3);
  });

  it('cripto não mostra indicadores fundamentalistas', () => {
    render(
      <AssetPage
        asset={need('crypto', 'btc')}
        quote={quote}
        history={histories}
        fundamentals={noFundamentals}
      />,
    );
    expect(screen.queryByRole('heading', { name: /Indicadores fundamentalistas/ })).toBeNull();
  });
});

describe('metadados', () => {
  it('11 indicadores com ajuda neutra', () => {
    expect(FUNDAMENTALS_META).toHaveLength(11);
    const text = FUNDAMENTALS_META.map((m) => m.help).join(' ');
    expect(text).not.toMatch(/barat|\bcar[oa]\b|oportunidade|compr[ae]/i);
  });
  it('riscos sem linguagem de recomendação', () => {
    expect(Object.keys(RISK_TEXTS).sort()).toEqual(['crypto', 'etf', 'fii', 'stock']);
    expect(Object.values(RISK_TEXTS).flat().join(' ')).not.toMatch(
      /compr[ae]|vend[ae]r|barat|car[oa]\b|oportunidade/i,
    );
  });
});
