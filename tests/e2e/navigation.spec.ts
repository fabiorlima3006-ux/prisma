import { expect, test } from '@playwright/test';

test('menu do celular leva a Mercados', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page
    .getByRole('dialog', { name: 'Menu principal' })
    .getByRole('link', { name: 'Mercados' })
    .click();
  await expect(page).toHaveURL(/\/mercados$/);
});

test('dropdown Investimentos leva a Ações no desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  await page.getByRole('button', { name: 'Investimentos' }).click();
  await page.getByRole('link', { name: 'Ações', exact: true }).click();
  await expect(page).toHaveURL(/\/acoes$/);
});
