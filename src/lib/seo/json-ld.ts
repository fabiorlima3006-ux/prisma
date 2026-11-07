import type { ArticleMeta } from '@/features/education/registry';
import { siteConfig } from '@/lib/config/site';
import { absoluteUrl } from './metadata';

const ORG = { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url } as const;

export function websiteJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: 'pt-BR',
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/busca?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function articleJsonLd(meta: ArticleMeta, path: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.description,
    dateModified: meta.updatedAt,
    inLanguage: 'pt-BR',
    author: ORG,
    publisher: ORG,
    mainEntityOfPage: absoluteUrl(path),
  };
}

/** O último item (página atual) pode vir sem href: o `item` é opcional nele. */
export function breadcrumbJsonLd(items: { label: string; href?: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: absoluteUrl(it.href) } : {}),
    })),
  };
}
