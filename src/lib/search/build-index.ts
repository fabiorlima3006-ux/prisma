import { listArticles, TRACKS } from '@/features/education/registry';
import { siteConfig, type NavItem } from '@/lib/config/site';
import { TOOLS } from '@/lib/config/tools';
import { CATALOG, CLASS_ROUTES } from '@/lib/data/catalog';
import type { AssetClass } from '@/lib/data/types';
import type { SearchEntry } from './search';

const CLASS_LABELS: Partial<Record<AssetClass, string>> = {
  stock: 'Ações',
  fii: 'FIIs',
  etf: 'ETFs',
  crypto: 'Cripto',
};

function leaves(items: NavItem[]): NavItem[] {
  return items.flatMap((i) => (i.children?.length ? leaves(i.children) : [i]));
}

const EXTRA_PAGES: NavItem[] = [
  { label: 'Sobre', href: '/sobre' },
  { label: 'Contato', href: '/contato' },
  { label: 'Termos de uso', href: '/termos' },
  { label: 'Privacidade', href: '/privacidade' },
  { label: 'Educação', href: '/educacao' },
  { label: 'Mercados', href: '/mercados' },
];

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const entries: SearchEntry[] = [];

  const routes = Object.keys(CLASS_ROUTES) as (keyof typeof CLASS_ROUTES)[];
  for (const a of CATALOG) {
    const route = routes.find((r) => CLASS_ROUTES[r] === a.class);
    const label = CLASS_LABELS[a.class];
    if (!route || !label) continue;
    entries.push({
      type: 'asset',
      title: a.ticker,
      subtitle: a.name,
      href: `/${route}/${a.slug}`,
      keywords: [...a.name.split(/\s+/), label],
    });
  }

  for (const t of TOOLS) {
    entries.push({
      type: 'tool',
      title: t.title,
      subtitle: t.status === 'planned' ? `${t.description} Em breve.` : t.description,
      href: t.href,
      keywords: t.keywords,
    });
  }

  const trackTitle = new Map<string, string>(TRACKS.map((t) => [t.slug, t.title]));
  for (const a of await listArticles()) {
    entries.push({
      type: 'article',
      title: a.title,
      subtitle: a.description,
      href: `/educacao/${a.track}/${a.slug}`,
      keywords: [...a.terms, trackTitle.get(a.track) ?? ''].filter(Boolean),
    });
  }

  const seen = new Set<string>();
  for (const p of [...leaves([...siteConfig.nav, ...siteConfig.userNav]), ...EXTRA_PAGES]) {
    if (p.href === '/investimentos' || seen.has(p.href)) continue;
    seen.add(p.href);
    entries.push({ type: 'page', title: p.label, href: p.href, keywords: [] });
  }

  return entries;
}
