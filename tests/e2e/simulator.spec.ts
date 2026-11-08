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
  await expect(page.getByTestId('final-balance')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('NaN');
});
