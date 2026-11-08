import { describe, expect, it } from 'vitest';
import { normalizeSiteUrl, siteConfig } from './site';

describe('siteConfig', () => {
  it('expõe todas as rotas de navegação do spec', () => {
    const hrefs = [
      ...siteConfig.nav,
      ...siteConfig.nav.flatMap((i) => i.children ?? []),
      ...siteConfig.userNav,
    ].map((i) => i.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/mercados',
        '/acoes',
        '/fiis',
        '/etfs',
        '/fundos',
        '/renda-fixa',
        '/cripto',
        '/opcoes',
        '/simuladores',
        '/ferramentas',
        '/educacao',
        '/noticias',
        '/carteira',
        '/analises',
        '/assistente',
        '/perfil',
      ]),
    );
  });

  it('nome centralizado', () => expect(siteConfig.name).toBe('Prisma'));

  it('normaliza a URL base removendo a barra final', () => {
    expect(normalizeSiteUrl('https://prisma.example.com/')).toBe('https://prisma.example.com');
    expect(normalizeSiteUrl('https://prisma.example.com//')).toBe('https://prisma.example.com');
    expect(normalizeSiteUrl(' https://prisma.example.com ')).toBe('https://prisma.example.com');
    expect(normalizeSiteUrl('https://prisma.example.com')).toBe('https://prisma.example.com');
    expect(normalizeSiteUrl(undefined)).toBe('http://localhost:3000');
    expect(normalizeSiteUrl('')).toBe('http://localhost:3000');
    expect(siteConfig.url.endsWith('/')).toBe(false);
  });
});
