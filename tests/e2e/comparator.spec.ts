import { expect, test } from '@playwright/test';

test('com o BCB indisponível, taxas manuais calculam o CDB', async ({ page }) => {
  await page.goto('/ferramentas/comparador');
  await expect(page.getByText('Taxas informadas pelo usuário')).toBeVisible();
  await page.getByLabel('CDI (% a.a.)').fill('10');
  await page.getByLabel('Selic meta (% a.a.)').fill('10,5');
  await page.getByLabel('Valor', { exact: true }).fill('10.000');
  await page.getByLabel('Prazo (dias)').fill('365');
  await expect(page.getByRole('row', { name: /CDB/ }).first()).toContainText('10.825,00');
  await expect(page.locator('body')).not.toContainText('NaN');
});
