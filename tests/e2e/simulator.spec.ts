import { expect, test } from '@playwright/test';

const URL =
  '/simuladores/juros-compostos?capital=1000&aporte=100&taxa=1&periodo=mes&prazo=12&unidade=meses';

test('mostra o saldo final esperado', async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByTestId('final-balance')).toContainText('2.395,08');
});

test('alterar o prazo atualiza a URL', async ({ page }) => {
  await page.goto(URL);
  await page.getByLabel('Prazo', { exact: true }).fill('24');
  await expect(page).toHaveURL(/prazo=24/);
});

test('capital no formato brasileiro não gera NaN', async ({ page }) => {
  await page.goto(URL);
  await page.getByLabel('Capital inicial').fill('1.000,50');
  // 1000,50 · 1,01^12 + 100 · (1,01^12 − 1) / 0,01
  await expect(page.getByTestId('final-balance')).toContainText('2.395,64');
  await expect(page.locator('body')).not.toContainText('NaN');
});

test('inflação informada mostra valor em reais de hoje', async ({ page }) => {
  await page.goto(URL);
  await page.getByLabel('Inflação anual esperada (premissa)').fill('10');
  // 2.395,08 ÷ 1,1 (12 meses)
  await expect(page.getByTestId('final-real')).toContainText('2.177,34');
  await expect(page.getByText('Valor final em reais de hoje')).toBeVisible();
});
