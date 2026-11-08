import Link from 'next/link';
import { FlowBand } from '@/components/illustrations/FlowBand';
import { GrowthBars } from '@/components/illustrations/GrowthBars';
import { HeroParticles } from '@/components/illustrations/HeroParticles';
import { AssetCard } from '@/components/market/AssetCard';
import { INDICATOR_LABELS } from '@/components/market/indicator-labels';
import { IndicatorStrip } from '@/components/market/IndicatorStrip';
import { Badge, Button, Card } from '@/components/ui';
import { TOOLS } from '@/lib/config/tools';
import { CLASS_ROUTES } from '@/lib/data/catalog';
import type { Asset, DataResult, IndicatorValue, Quote } from '@/lib/data/types';
import { LEVEL_LABEL, LEVEL_TONE } from '@/features/education/labels';
import { TRACKS } from '@/features/education/tracks';

const wrap = 'mx-auto w-full max-w-6xl px-4 sm:px-6';
const h2 = 'text-2xl font-extrabold tracking-tight text-text';
const eyebrow = 'mb-1 font-mono text-xs tracking-wider text-accent';

export function HeroSection() {
  return (
    <section className="hero-grid-glow -mt-[var(--header-h)] bg-hero pt-[var(--header-h)] text-white">
      <div className={`${wrap} grid items-center gap-6 pt-10 lg:grid-cols-[1fr_1.1fr]`}>
        <div>
          <p className="mb-2 font-mono text-xs tracking-wider text-[#2fd3ff]">
            {'// central de investimentos'}
          </p>
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            Entenda o mercado. Analise seus investimentos. Tome decisões mais conscientes.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/80">
            Uma plataforma completa para acompanhar mercados, estudar investimentos, analisar ativos
            e simular cenários.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/mercados" shine>
              Explorar mercados
            </Button>
            <Button
              href="/ferramentas"
              variant="ghost"
              className="border-[1.5px] border-white/30 text-white hover:bg-white/10"
            >
              Conhecer ferramentas
            </Button>
          </div>
        </div>
        <HeroParticles />
      </div>
      <FlowBand />
    </section>
  );
}

type StripResults = DataResult<IndicatorValue | Quote>[];

export function MarketStrip({
  bcb,
  market,
}: {
  bcb: DataResult<IndicatorValue>[];
  market: DataResult<Quote>[];
}) {
  return (
    <section aria-label="Indicadores de mercado" className={`${wrap} relative z-10 -mt-8`}>
      <IndicatorStrip
        groups={[
          {
            results: bcb as StripResults,
            labels: (['selic', 'cdi', 'ipca12m', 'ptax'] as const).map(
              (id) => INDICATOR_LABELS[id],
            ),
          },
          {
            results: market as StripResults,
            labels: ['Ibovespa', 'S&P 500', 'Bitcoin'],
            testId: 'strip-group-demo',
          },
        ]}
      />
    </section>
  );
}

export function StatsStrip() {
  const stats = [
    { value: Object.keys(CLASS_ROUTES).length, label: 'classes de ativos' },
    { value: TOOLS.filter((t) => t.status === 'available').length, label: 'ferramentas disponíveis' },
    { value: TRACKS.length, label: 'trilhas de educação' },
  ];
  return (
    <section aria-label="A plataforma em números" className={`${wrap} mt-10`}>
      <dl className="grid grid-cols-3 gap-3 text-center">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col-reverse rounded-xl border border-line bg-surface p-4"
          >
            <dt className="mt-1 text-xs text-muted">{s.label}</dt>
            <dd className="font-mono text-3xl font-bold text-text">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export type HighlightItem = { asset: Asset; quote: DataResult<Quote>; href: string };

export function HighlightsSection({ items }: { items: HighlightItem[] }) {
  return (
    <section className={`${wrap} mt-14`}>
      <p className={eyebrow}>{'// destaques'}</p>
      <h2 className={h2}>Ativos do catálogo</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((i) => (
          <AssetCard key={i.asset.ticker} asset={i.asset} quote={i.quote} href={i.href} />
        ))}
        <Card as="article" interactive>
          <Link href="/noticias" className="block no-underline">
            <span className="font-mono text-sm font-bold text-text">Notícias — em breve</span>
            <p className="mt-2 text-xs">
              Um resumo do que movimenta os mercados, com fontes identificadas.
            </p>
          </Link>
        </Card>
      </div>
    </section>
  );
}

function toolById(id: string) {
  const t = TOOLS.find((x) => x.id === id && x.status === 'available');
  if (!t) throw new Error(`Ferramenta indisponível: ${id}`);
  return t;
}

export function ToolsSection() {
  const sim = toolById('juros-compostos');
  const cmp = toolById('comparador');
  return (
    <section className={`${wrap} mt-14`}>
      <p className={eyebrow}>{'// ferramentas'}</p>
      <h2 className={h2}>Simule cenários com clareza</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Card as="article" interactive className="p-5">
          <GrowthBars />
          <h3 className="mt-3 text-base font-bold text-text">{sim.title}</h3>
          <p className="mt-1">{sim.description}</p>
          <Link href={sim.href} className="mt-3 inline-block font-semibold text-accent">
            Abrir simulador →
          </Link>
        </Card>
        <Card as="article" interactive className="p-5">
          <h3 className="text-base font-bold text-text">{cmp.title}</h3>
          <p className="mt-1">{cmp.description}</p>
          <Link href={cmp.href} className="mt-3 inline-block font-semibold text-accent">
            Abrir comparador →
          </Link>
        </Card>
      </div>
    </section>
  );
}

export function TracksSection() {
  return (
    <section className={`${wrap} mt-14`}>
      <p className={eyebrow}>{'// educação'}</p>
      <h2 className={h2}>Trilhas para aprender no seu ritmo</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {TRACKS.map((t) => (
          <Card as="article" interactive key={t.slug} className="p-5">
            <Badge tone={LEVEL_TONE[t.slug]}>{LEVEL_LABEL[t.slug]}</Badge>
            <h3 className="mt-3 text-base font-bold text-text">{t.title}</h3>
            <p className="mt-1">{t.description}</p>
            <Link
              href={`/educacao/${t.slug}`}
              className="mt-3 inline-block font-semibold text-accent"
            >
              Conhecer →
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function AssistantShowcase() {
  return (
    <section className={`${wrap} mt-14`}>
      <div className="grid items-center gap-6 rounded-2xl border border-line bg-surface p-5 md:grid-cols-2 md:p-8">
        <div>
          <p className={eyebrow}>{'// assistente'}</p>
          <h2 className={h2}>Tire dúvidas em linguagem simples</h2>
          <p className="mt-3 text-muted">
            Um assistente para explicar conceitos e estratégias de forma educativa.
          </p>
          <div className="mt-3">
            <Badge tone="neutral">Em breve</Badge>
          </div>
          <p className="mt-3 text-xs text-muted">
            Conteúdo educativo. Não é recomendação de investimento.
          </p>
          <Link href="/assistente" className="mt-3 inline-block font-semibold text-accent">
            Conhecer o Assistente →
          </Link>
        </div>
        <div className="flex flex-col gap-3 text-sm" aria-label="Exemplo de conversa" role="group">
          <p className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-accent/15 px-4 py-2 text-text">
            Como funciona uma trava de alta?
          </p>
          <p className="max-w-[90%] self-start rounded-2xl rounded-bl-sm bg-surface-2 px-4 py-2 text-text">
            É uma estratégia com opções que combina duas posições de compra e venda de strikes
            diferentes. O ganho máximo é limitado e a perda máxima também é limitada, e ambos são
            conhecidos de antemão.
          </p>
          <span aria-hidden="true" className="flex gap-1 self-start pl-2">
            <i className="h-2 w-2 rounded-full bg-muted" />
            <i className="h-2 w-2 rounded-full bg-muted opacity-70" />
            <i className="h-2 w-2 rounded-full bg-muted opacity-40" />
          </span>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className={`${wrap} mt-14 mb-16`}>
      <div className="rounded-2xl bg-hero px-6 py-10 text-center text-white">
        <h2 className="text-2xl font-extrabold tracking-tight">Comece explorando</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/75">
          Acompanhe os mercados, estude com calma e simule cenários antes de decidir.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button href="/mercados">Ver mercados</Button>
          <Button
            href="/educacao"
            variant="ghost"
            className="border-[1.5px] border-white/30 text-white hover:bg-white/10"
          >
            Começar a estudar
          </Button>
        </div>
      </div>
    </section>
  );
}
