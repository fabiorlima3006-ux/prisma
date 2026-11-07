import { render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GrowthBars } from '@/components/illustrations/GrowthBars';
import { HeroParticles } from '@/components/illustrations/HeroParticles';
import { chartPoints, seededRandom } from '@/components/illustrations/particles';
import { TOOLS } from '@/lib/config/tools';
import { CATALOG } from '@/lib/data/catalog';
import type { Asset, DataMeta, DataResult, IndicatorValue, Quote } from '@/lib/data/types';
import {
  AssistantShowcase,
  FinalCta,
  HeroSection,
  HighlightsSection,
  MarketStrip,
  StatsStrip,
  ToolsSection,
  TracksSection,
} from './sections';
import { TRACKS_COUNT } from './tracks-placeholder';

const demo: DataMeta = {
  source: 'demo',
  isDemo: true,
  asOf: '2026-11-07T12:00:00Z',
  attribution: 'x',
};
const bcb: DataMeta = {
  source: 'bcb',
  isDemo: false,
  asOf: '2026-11-07T12:00:00Z',
  attribution: 'Banco Central do Brasil — SGS',
};
const ind = (id: IndicatorValue['id'], value: number): DataResult<IndicatorValue> => ({
  status: 'ok',
  data: { id, value, unit: id === 'ptax' ? 'BRL' : 'a.a.', referenceDate: '2026-11-07' },
  meta: bcb,
});
const quote: DataResult<Quote> = {
  status: 'ok',
  data: {
    price: 100,
    change: { day: 0.01, week: null, month: null, year: null },
    volume: null,
    dayHigh: null,
    dayLow: null,
    high52w: null,
    low52w: null,
  },
  meta: demo,
};
const asset = (t: string): Asset => CATALOG.find((a) => a.ticker === t) as Asset;

function Page() {
  return (
    <>
      <HeroSection />
      <MarketStrip
        bcb={[ind('selic', 0.105), ind('cdi', 0.104), ind('ipca12m', 0.045), ind('ptax', 5.2)]}
        market={[quote, quote, quote]}
      />
      <StatsStrip />
      <HighlightsSection
        items={[
          { asset: asset('PETR4'), quote, href: '/acoes/petr4' },
          { asset: asset('MXRF11'), quote, href: '/fiis/mxrf11' },
          { asset: asset('BOVA11'), quote, href: '/etfs/bova11' },
          { asset: asset('BTC'), quote, href: '/cripto/btc' },
        ]}
      />
      <ToolsSection />
      <TracksSection />
      <AssistantShowcase />
      <FinalCta />
    </>
  );
}

describe('Home', () => {
  it('hero, CTAs e selo demonstrativo no grupo de mercado', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Entenda o mercado. Analise seus investimentos. Tome decisões mais conscientes.',
    );
    expect(screen.getAllByRole('link', { name: 'Explorar mercados' })[0]).toHaveAttribute(
      'href',
      '/mercados',
    );
    expect(screen.getAllByRole('link', { name: 'Conhecer ferramentas' })[0]).toHaveAttribute(
      'href',
      '/ferramentas',
    );
    expect(
      within(screen.getByTestId('strip-group-demo')).getByText('DADOS DEMONSTRATIVOS'),
    ).toBeInTheDocument();
  });

  it('números da faixa vêm dos registros', () => {
    render(<Page />);
    expect(screen.getByText(String(TOOLS.length))).toBeInTheDocument();
    expect(TOOLS).toHaveLength(10);
    const classes = new Set(CATALOG.map((a) => a.class)).size;
    expect(screen.getByText(String(classes))).toBeInTheDocument();
    expect(TRACKS_COUNT).toBe(3);
  });

  it('destaques, trilhas e assistente', () => {
    render(<Page />);
    expect(screen.getByRole('link', { name: /Notícias/ })).toHaveAttribute('href', '/noticias');
    expect(screen.getAllByRole('link', { name: 'Conhecer →' })).toHaveLength(TRACKS_COUNT);
    expect(screen.getByText('Em breve', { selector: 'span' })).toBeInTheDocument();
    expect(
      screen.getByText('Conteúdo educativo. Não é recomendação de investimento.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /assistente/i })).toHaveAttribute(
      'href',
      '/assistente',
    );
  });

  it('não usa linguagem proibida', () => {
    render(<Page />);
    expect(document.body.textContent).not.toMatch(
      /garantid|melhor investimento|fique rico|(compre|venda|caro|barato)|oportunidade/i,
    );
  });
});

describe('GrowthBars', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renderiza barras visíveis e arma a animação após montar', async () => {
    const { container } = render(<GrowthBars />);
    expect(container.querySelectorAll('.gb-bar')).toHaveLength(6);
    await waitFor(() => expect(container.querySelector('svg')).toHaveClass('gb-armed'));
  });

  it('com reduced motion não arma a animação', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q }));
    const { container } = render(<GrowthBars />);
    await new Promise((r) => setTimeout(r, 20));
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveClass('gb-armed');
  });
});

describe('HeroParticles', () => {
  const fakeCtx = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    setTransform: vi.fn(),
    fillStyle: '',
    globalAlpha: 1,
  };
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeCtx as unknown as CanvasRenderingContext2D,
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fakeCtx.fillRect.mockClear();
  });

  it('sem contexto 2D renderiza o canvas sem quebrar', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<HeroParticles />);
    expect(
      screen.getByRole('img', { name: 'Ilustração: gráfico em alta formado por pontos' }),
    ).toBeInTheDocument();
  });

  it('com reduced motion desenha uma vez e não agenda rAF', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q }));
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    render(<HeroParticles />);
    expect(fakeCtx.fillRect).toHaveBeenCalled();
    expect(raf).not.toHaveBeenCalled();
  });

  it('layout é determinístico', () => {
    const a = chartPoints(400, 300, 100, seededRandom(7));
    const b = chartPoints(400, 300, 100, seededRandom(7));
    expect(a).toEqual(b);
    expect(a).toHaveLength(100);
  });
});
