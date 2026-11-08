import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ARTICLE, KEY_PAGES } from './routes';

const PAGES = [...KEY_PAGES, ARTICLE];

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
      await page.waitForLoadState('networkidle'); // gráficos carregam sob demanda
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
