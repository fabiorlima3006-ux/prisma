import { describe, expect, it } from 'vitest';
import { siteConfig } from './site';

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
});
