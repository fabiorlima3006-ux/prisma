import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

export type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  /** Data ISO (AAAA-MM-DD) de atualização; vira publishedTime/modifiedTime em artigos. */
  updatedAt?: string;
  /** Usa o título sem o template "%s | Prisma" (Home). */
  absoluteTitle?: boolean;
  noindex?: boolean;
};

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path}`;
}

export function buildMetadata(opts: BuildMetadataOptions): Metadata {
  const { title, description, path, type = 'website', updatedAt, absoluteTitle, noindex } = opts;
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph:
      type === 'article'
        ? {
            type: 'article',
            title: fullTitle,
            description,
            url,
            locale: 'pt_BR',
            siteName: siteConfig.name,
            ...(updatedAt ? { publishedTime: updatedAt, modifiedTime: updatedAt } : {}),
          }
        : {
            type: 'website',
            title: fullTitle,
            description,
            url,
            locale: 'pt_BR',
            siteName: siteConfig.name,
          },
    twitter: { card: 'summary_large_image', title: fullTitle, description },
    ...(noindex ? { robots: { index: false } } : {}),
  };
}
