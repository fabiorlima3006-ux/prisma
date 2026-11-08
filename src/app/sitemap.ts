import type { MetadataRoute } from 'next';
import { listArticles, TRACKS } from '@/features/education/registry';
import { assetHref } from '@/features/asset-page/class-info';
import { siteConfig } from '@/lib/config/site';
import { CATALOG } from '@/lib/data/catalog';

const STATIC_PATHS = [
  '/mercados',
  '/acoes',
  '/fiis',
  '/etfs',
  '/cripto',
  '/simuladores',
  '/simuladores/juros-compostos',
  '/ferramentas',
  '/ferramentas/comparador',
  '/educacao',
  '/renda-fixa',
  '/fundos',
  '/opcoes',
  '/noticias',
  '/carteira',
  '/analises',
  '/assistente',
  '/perfil',
  '/sobre',
  '/contato',
  '/termos',
  '/privacidade',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listArticles();
  const assetPaths = CATALOG.flatMap((a) => {
    const href = assetHref(a);
    return href ? [href] : [];
  });
  const plain = ['/', ...STATIC_PATHS, ...assetPaths, ...TRACKS.map((t) => `/educacao/${t.slug}`)];
  return [
    ...plain.map((p) => ({
      url: `${siteConfig.url}${p}`,
      changeFrequency:
        p === '/' || assetPaths.includes(p) ? ('daily' as const) : ('monthly' as const),
      priority: p === '/' ? 1 : 0.6,
    })),
    ...articles.map((a) => ({
      url: `${siteConfig.url}/educacao/${a.track}/${a.slug}`,
      lastModified: new Date(a.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
