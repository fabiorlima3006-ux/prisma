import { expect, test } from '@playwright/test';
import { ROUTES } from './routes';

for (const route of ROUTES) {
  test(`${route} responde 200 com exatamente um h1`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
  });
}

test('ativo inexistente responde 404', async ({ page }) => {
  const res = await page.goto('/acoes/nao-existe');
  expect(res?.status()).toBe(404);
});

test('ativo na classe errada responde 404', async ({ page }) => {
  const res = await page.goto('/fiis/petr4');
  expect(res?.status()).toBe(404);
});

test('ticker em maiúsculas redireciona para minúsculas', async ({ page }) => {
  await page.goto('/acoes/PETR4');
  await expect(page).toHaveURL(/\/acoes\/petr4$/);
});
