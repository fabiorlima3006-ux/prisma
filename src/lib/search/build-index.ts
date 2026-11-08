import { listArticles, TRACKS } from '@/features/education/registry';
import { siteConfig, type NavItem } from '@/lib/config/site';
import { TOOLS } from '@/lib/config/tools';
import { assetHref, CLASS_LABELS } from '@/features/asset-page/class-info';
import { CATALOG } from '@/lib/data/catalog';
import type { SearchEntry } from './search';

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

let memo: Promise<SearchEntry[]> | null = null;

export function buildSearchIndex(): Promise<SearchEntry[]> {
  memo ??= compute().catch((e: unknown) => {
    memo = null;
    throw e;
  });
  return memo;
}

async function compute(): Promise<SearchEntry[]> {
  const entries: SearchEntry[] = [];

  for (const a of CATALOG) {
    // Só ativos com página (índices e câmbio ficam fora da busca).
    const href = assetHref(a);
    if (!href) continue;
    entries.push({
      type: 'asset',
      title: a.ticker,
      subtitle: a.name,
      href,
      keywords: [...a.name.split(/\s+/), CLASS_LABELS[a.class]],
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
