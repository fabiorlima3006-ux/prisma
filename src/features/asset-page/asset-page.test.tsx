import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getAsset } from '@/lib/data/catalog';
import type {
  Asset,
  DataMeta,
  DataResult,
  Fundamentals,
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
    expect(screen.getAllByText('01/10/2026').length).toBeGreaterThan(0);
    expect(screen.queryByText('2026-10-01')).toBeNull();
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

  it('P/L com prejuízo mostra "Não se aplica" com o motivo', async () => {
    const fundamentals: DataResult<Fundamentals> = {
      status: 'ok',
      meta: { source: 'brapi', isDemo: false, asOf: '2026-11-07T12:00:00Z', attribution: 'brapi.dev' },
      data: {
        pl: null,
        pvp: null,
        roe: null,
        roic: null,
        netMargin: null,
        ebitdaMargin: null,
        netDebtToEbitda: null,
        dividendYield: null,
        payout: null,
        revenueCagr5y: null,
        earningsCagr5y: null,
        notApplicable: { pl: 'A empresa teve prejuízo nos últimos 12 meses.' },
      },
    };
    const user = userEvent.setup();
    render(
      <AssetPage
        asset={need('stock', 'petr4')}
        quote={quote}
        history={histories}
        fundamentals={fundamentals}
      />,
    );
    const card = screen.getByText('P/L', { selector: 'span' }).closest('article') as HTMLElement;
    expect(within(card).getByText('Não se aplica')).toBeInTheDocument();
    await user.hover(within(card).getByRole('button', { name: 'Por que não se aplica?' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('prejuízo nos últimos 12 meses');
  });

  it('cripto: faixa de 52 semanas em dólar (US$)', () => {
    render(
      <AssetPage
        asset={need('crypto', 'btc')}
        quote={quote}
        history={histories}
        fundamentals={noFundamentals}
      />,
    );
    const range = screen.getByRole('img', { name: /^Mínima/ });
    expect(range.getAttribute('aria-label')).toMatch(/Mínima US\$\s?30,00, máxima US\$\s?45,00/);
    expect(range.getAttribute('aria-label')).not.toMatch(/R\$/);
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
