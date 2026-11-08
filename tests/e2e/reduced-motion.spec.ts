import { expect, test } from '@playwright/test';

test('reduzir movimento deixa tudo estático', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'load' });

  const animated = await page.evaluate(() =>
    [...document.querySelectorAll('svg *, .gb-bar')]
      .filter((el) => getComputedStyle(el).animationName !== 'none')
      .map((el) => `${el.tagName}.${el.getAttribute('class') ?? ''}`),
  );
  expect(animated).toEqual([]);

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeAttached();
  const snap = () => canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  const first = await snap();
  await page.waitForTimeout(500);
  expect(await snap()).toBe(first);
});
