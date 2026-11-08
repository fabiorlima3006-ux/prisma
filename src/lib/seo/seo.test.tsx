import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JsonLd } from '@/components/JsonLd';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { siteConfig } from '@/lib/config/site';
import { articleJsonLd, breadcrumbJsonLd, websiteJsonLd } from './json-ld';
import { buildMetadata } from './metadata';

describe('buildMetadata', () => {
  it('define canonical, openGraph e twitter', () => {
    const m = buildMetadata({ title: 'Mercados', description: 'd', path: '/mercados' });
    expect(m.alternates?.canonical).toBe(`${siteConfig.url}/mercados`);
    expect(m.title).toBe('Mercados');
    expect(m.openGraph).toMatchObject({
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Prisma',
      url: `${siteConfig.url}/mercados`,
    });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('artigo inclui datas de publicação e modificação', () => {
    const m = buildMetadata({
      title: 'A',
      description: 'd',
      path: '/educacao/x/y',
      type: 'article',
      updatedAt: '2026-01-05',
    });
    expect(m.openGraph).toMatchObject({
      type: 'article',
      modifiedTime: '2026-01-05',
    });
    expect(m.openGraph).not.toHaveProperty('publishedTime');
  });

  it('home usa título absoluto e noindex é opcional', () => {
    const m = buildMetadata({ title: 'Home', absoluteTitle: true, description: 'd', path: '/' });
    expect(m.title).toEqual({ absolute: 'Home' });
    expect(m.alternates?.canonical).toBe(`${siteConfig.url}/`);
    expect(
      buildMetadata({ title: 'B', description: 'd', path: '/busca', noindex: true }).robots,
    ).toEqual({ index: false });
  });
});

describe('imagem OG', () => {
  it('openGraph e twitter carregam a imagem padrão', () => {
    const m = buildMetadata({ title: 'M', description: 'd', path: '/mercados' });
    const img = { url: `${siteConfig.url}/opengraph-image`, width: 1200, height: 630 };
    expect(m.openGraph?.images).toEqual([expect.objectContaining(img)]);
    expect(m.twitter?.images).toEqual([expect.objectContaining(img)]);
  });
});

describe('busca', () => {
  it('é noindex com e sem q', async () => {
    const { generateMetadata } = await import('@/app/busca/page');
    const a = await generateMetadata({ searchParams: Promise.resolve({}) });
    const b = await generateMetadata({ searchParams: Promise.resolve({ q: 'petr' }) });
    expect(a.robots).toEqual({ index: false });
    expect(b.robots).toEqual({ index: false });
    expect(b.title).toBe('Busca: petr');
  });
});

describe('sitemap', () => {
  it('inclui páginas esperadas e exclui rotas proibidas', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toEqual(
      expect.arrayContaining([
        `${siteConfig.url}/`,
        `${siteConfig.url}/acoes/petr4`,
        `${siteConfig.url}/educacao/avancado/introducao-a-opcoes`,
        `${siteConfig.url}/simuladores/juros-compostos`,
        `${siteConfig.url}/ferramentas/comparador`,
      ]),
    );
    for (const bad of [
      '/api/',
      '/investimentos',
      '/busca',
      '/entrar',
      '/ibov',
      '/spx',
      '/usdbrl',
    ]) {
      expect(urls.some((u) => u.includes(bad))).toBe(false);
    }
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe('robots', () => {
  it('permite tudo menos a API e aponta o sitemap', () => {
    const r = robots();
    expect(r.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: ['/api/'] });
    expect(r.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
  });
});

describe('JSON-LD', () => {
  it('escapa < para impedir fechar o script', () => {
    render(<JsonLd data={{ name: '</script><script>alert(1)</script>' }} />);
    const el = document.querySelector('script[type="application/ld+json"]')!;
    expect(el.innerHTML).not.toContain('</script><script>');
    expect(el.innerHTML).toContain(String.raw`\u003c`);
  });

  it('website tem SearchAction para /busca', () => {
    const d = websiteJsonLd() as Record<string, unknown>;
    expect(d['@type']).toBe('WebSite');
    expect(JSON.stringify(d)).toContain('/busca?q={search_term_string}');
  });

  it('artigo e breadcrumb', () => {
    const a = articleJsonLd(
      {
        title: 'T',
        description: 'D',
        level: 'iniciante',
        readingMinutes: 3,
        updatedAt: '2026-01-05',
        terms: [],
        relatedTools: [],
      },
      '/educacao/iniciante/t',
    ) as Record<string, unknown>;
    expect(a).toMatchObject({
      '@type': 'Article',
      headline: 'T',
      dateModified: '2026-01-05',
      inLanguage: 'pt-BR',
    });
    const b = breadcrumbJsonLd([
      { label: 'Início', href: '/' },
      { label: 'Mercados', href: '/mercados' },
    ]) as { itemListElement: { position: number; item: string }[] };
    expect(b.itemListElement[1]).toMatchObject({
      position: 2,
      item: `${siteConfig.url}/mercados`,
    });
  });
});

describe('cobertura de metadata', () => {
  it('toda página exporta metadata ou generateMetadata', () => {
    const files = globSync('src/app/**/page.tsx');
    expect(files.length).toBeGreaterThan(20);
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).toMatch(
        /export (const|async function|function) (metadata|generateMetadata)\b|export const generateMetadata\b/,
      );
    }
  });
});
