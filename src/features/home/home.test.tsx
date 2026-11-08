import { act, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FLOW_BAND_DURATION_MS, FlowBand } from '@/components/illustrations/FlowBand';
import { GrowthBars } from '@/components/illustrations/GrowthBars';
import { HeroParticles } from '@/components/illustrations/HeroParticles';
import { chartPoints, seededRandom } from '@/components/illustrations/particles';
import { TOOLS } from '@/lib/config/tools';
import { CATALOG, CLASS_ROUTES } from '@/lib/data/catalog';
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
import { TRACKS } from '@/features/education/tracks';

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

  it('números da faixa vêm dos registros (só o que tem página ou está disponível)', () => {
    render(<Page />);
    const stats = within(screen.getByRole('region', { name: 'A plataforma em números' }));
    const value = (label: string) => stats.getByText(label).parentElement?.querySelector('dd');
    const available = TOOLS.filter((t) => t.status === 'available').length;
    expect(available).toBe(2);
    expect(value('ferramentas disponíveis')).toHaveTextContent(String(available));
    expect(Object.keys(CLASS_ROUTES)).toHaveLength(4);
    expect(value('classes de ativos')).toHaveTextContent('4');
    expect(value('trilhas de educação')).toHaveTextContent(String(TRACKS.length));
    expect(TRACKS).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Ativos do catálogo' })).toBeInTheDocument();
  });

  it('destaques, trilhas e assistente', () => {
    render(<Page />);
    expect(screen.getByRole('link', { name: /Notícias/ })).toHaveAttribute('href', '/noticias');
    expect(screen.getAllByRole('link', { name: 'Conhecer →' })).toHaveLength(TRACKS.length);
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

describe('FlowBand', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('para depois de 5 s e congela o último quadro (sem rAF pendente)', () => {
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => queue.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    render(<FlowBand />);
    let now = 0;
    let frames = 0;
    while (queue.length > 0 && frames < 2000) {
      const cb = queue.shift();
      now += 16;
      frames++;
      cb?.(now);
    }
    expect(queue).toHaveLength(0);
    expect(now).toBeGreaterThanOrEqual(FLOW_BAND_DURATION_MS);
    expect(now).toBeLessThan(FLOW_BAND_DURATION_MS + 100);
  });
});

describe('btn-shine', () => {
  it('não anima infinitamente (WCAG 2.2.2)', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
    expect(css).not.toMatch(/infinite/);
    const block = css.slice(css.indexOf('.btn-shine {'), css.indexOf('@keyframes prisma-shine'));
    const durations = [...block.matchAll(/animation:\s*[\w-]+\s+([\d.]+)s\s+[\w-]+\s+(\d+);/g)];
    expect(durations).toHaveLength(2);
    for (const [, sec, count] of durations) expect(Number(sec) * Number(count)).toBeLessThanOrEqual(5);
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
    // Por padrão, o "ocioso" chega na hora; os testes de agendamento sobrescrevem.
    vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 50 });
      return 1;
    });
    vi.stubGlobal('cancelIdleCallback', () => {});
  });

  it('só começa a desenhar quando o navegador fica ocioso (requestIdleCallback)', () => {
    const idle: IdleRequestCallback[] = [];
    vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) => idle.push(cb));
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    render(<HeroParticles />);
    expect(idle).toHaveLength(1);
    expect(raf).not.toHaveBeenCalled();
    expect(fakeCtx.setTransform).not.toHaveBeenCalled();
    act(() => idle[0]?.({ didTimeout: false, timeRemaining: () => 50 }));
    expect(fakeCtx.setTransform).toHaveBeenCalled();
    expect(raf).toHaveBeenCalled();
  });

  it('sem requestIdleCallback, começa após setTimeout de 200 ms', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q }));
    try {
      render(<HeroParticles />);
      vi.advanceTimersByTime(199);
      expect(fakeCtx.fillRect).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(fakeCtx.fillRect).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fakeCtx.fillRect.mockClear();
    fakeCtx.setTransform.mockClear();
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

  it('depois de "formed" desenha o quadro final e não agenda mais rAF', () => {
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => queue.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    render(<HeroParticles />);
    let now = 0;
    let frames = 0;
    while (queue.length > 0 && frames < 2000) {
      const cb = queue.shift();
      now += 16;
      frames++;
      cb?.(now);
    }
    // sphere (2,2 s) + explode (0,45 s) + morph (2 s) ≈ 4,7 s ≈ 290 quadros; depois, nada.
    expect(frames).toBeLessThan(400);
    expect(queue).toHaveLength(0);
    expect(fakeCtx.fillRect).toHaveBeenCalled();
  });

  it('layout é determinístico', () => {
    const a = chartPoints(400, 300, 100, seededRandom(7));
    const b = chartPoints(400, 300, 100, seededRandom(7));
    expect(a).toEqual(b);
    expect(a).toHaveLength(100);
  });
});
