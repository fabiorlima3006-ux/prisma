import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('o caso padrão aparece sem NaN e mudar a renda atualiza a URL', async ({ page }) => {
  await page.goto('/simuladores/independencia-financeira');
  await expect(
    page.getByRole('heading', { name: 'Aposentadoria e independência financeira', level: 1 }),
  ).toBeVisible();
  await expect(page.getByTestId('required-wealth')).toContainText('R$');
  await expect(page.getByTestId('time-to-target')).toContainText('anos');
  await expect(page.locator('body')).not.toContainText(/NaN|Infinity|undefined/);
  await page.getByLabel('Renda mensal desejada').fill('6000');
  await expect(page).toHaveURL(/renda=6000/);
  await expect(page.locator('body')).not.toContainText(/NaN|Infinity|undefined/);
});

test('o axe não encontra violações com o resultado na tela', async ({ page }) => {
  await page.goto('/simuladores/independencia-financeira?alvo=60');
  await expect(page.getByTestId('required-wealth')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
