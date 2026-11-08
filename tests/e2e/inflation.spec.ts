import { expect, test } from '@playwright/test';

// O E2E roda com o BCB inacessível de propósito.
test('com o BCB fora, a aba Corrigir mostra "Dado indisponível no momento"', async ({ page }) => {
  await page.goto('/simuladores/inflacao');
  await expect(page.getByText('Dado indisponível no momento').first()).toBeVisible();
  await expect(page.getByLabel('Mês inicial (MM/aaaa)')).toHaveCount(0);
});

test('a aba Futuro com 5% calcula sem NaN', async ({ page }) => {
  await page.goto('/simuladores/inflacao');
  await page.getByRole('tab', { name: 'Poder de compra no futuro' }).click();
  await page.getByLabel('Inflação anual esperada (premissa)').fill('5');
  await page.getByLabel('Prazo (anos)').fill('2');
  await expect(page.getByTestId('needed-future')).toContainText('1.102,50');
  await expect(page.getByTestId('today-equivalent')).toContainText('907,03');
  await expect(page.locator('body')).not.toContainText('NaN');
  await expect(page).toHaveURL(/aba=futuro/);
});
