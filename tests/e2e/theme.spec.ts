import { expect, test } from '@playwright/test';

test('tema escuro persiste após recarregar', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const toggle = page.getByRole('button', { name: 'Alternar tema (claro/escuro)' });
  if (((await html.getAttribute('class')) ?? '').includes('dark')) {
    await toggle.click();
    await expect(html).not.toHaveClass(/dark/);
  }
  await toggle.click();
  await expect(html).toHaveClass(/dark/);
  await page.reload();
  await expect(html).toHaveClass(/dark/);
});
