import { expect, test } from '@playwright/test';

test('todo valor demonstrativo da Home está num grupo rotulado', async ({ page }) => {
  await page.goto('/');
  const values = page.locator('[data-demo-value]');
  expect(await values.count()).toBeGreaterThan(0);
  const unlabeled = await values.evaluateAll(
    (els) =>
      els.filter((el) => {
        const group = el.closest('[data-source-group]');
        return !group || !(group.textContent ?? '').includes('DADOS DEMONSTRATIVOS');
      }).length,
  );
  expect(unlabeled).toBe(0);
});
