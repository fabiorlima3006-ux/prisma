import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('abre com as duas colunas, sem NaN, e mudar o prazo atualiza a URL', async ({ page }) => {
  await page.goto('/simuladores/financiamento');
  await expect(
    page.getByRole('heading', { name: 'Financiamento: SAC e Price', level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'SAC', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Price', level: 2 })).toBeVisible();
  await expect(page.getByTestId('sac-first')).toContainText('R$');
  await expect(page.getByTestId('price-first')).toContainText('R$');
  await expect(page.locator('body')).not.toContainText(/NaN|Infinity|undefined/);
  await page.getByLabel('Prazo (meses)').fill('240');
  await expect(page).toHaveURL(/prazo=240/);
  await expect(page.locator('body')).not.toContainText(/NaN|Infinity|undefined/);
});

test('não rola na horizontal em 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/simuladores/financiamento?extra=500');
  await expect(page.getByTestId('sac-first')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('o axe não encontra violações com o resultado na tela', async ({ page }) => {
  await page.goto('/simuladores/financiamento?extra=500');
  await expect(page.getByTestId('sac-first')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
