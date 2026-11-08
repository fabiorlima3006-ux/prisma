import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ARTICLE, KEY_PAGES } from './routes';

const PAGES = [...KEY_PAGES, ARTICLE];

// Causa do timeout intermitente (~1 em 4 execuções completas): logo após o `next build`, o
// servidor de produção fica 10-20 s sem aceitar conexões (até uma sonda fora do browser ficou
// pendurada; goto, CSS e JS do primeiro teste de cada worker esperavam juntos). O app não é
// o problema: com o servidor já quente os mesmos testes levam ~1,5 s. O global-setup espera
// o servidor estabilizar; aqui cada worker ainda faz uma navegação de aquecimento (browser +
// primeira página) com timeout próprio, e os testes seguem com o timeout padrão.
test.beforeAll(async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL });
  try {
    await (await context.newPage()).goto('/', { timeout: 90_000 });
  } finally {
    await context.close();
  }
});

for (const theme of ['light', 'dark'] as const) {
  for (const route of PAGES) {
    test(`${route} sem violações graves (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('theme', t);
        } catch {
          // sem storage: vale o tema padrão
        }
      }, theme);
      await page.goto(route);
      // Gráficos carregam sob demanda, só perto da viewport: rola até cada figura visível e
      // espera o svg antes do axe, para analisar a página com todos os gráficos montados
      // (networkidle não serve, os prefetches de Link mantêm a rede ocupada). Figuras em abas
      // ocultas (hidden) ficam de fora, como para o usuário.
      const figures = page.locator('figure[aria-label]:visible');
      for (let i = 0; i < (await figures.count()); i++) {
        const figure = figures.nth(i);
        await figure.scrollIntoViewIfNeeded();
        await expect(figure.locator('svg.recharts-surface')).toBeAttached();
      }
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/);
      else await expect(page.locator('html')).not.toHaveClass(/dark/);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(
        serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([]);
    });
  }
}
