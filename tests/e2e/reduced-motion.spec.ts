import { expect, test, type Locator } from '@playwright/test';

// Intervalo entre os dois instantâneos do canvas: longo o bastante para várias
// partículas se moverem (a animação roda a ~60 fps), curto para não alongar o teste.
const SNAPSHOT_GAP_MS = 500;

const snap = (canvas: Locator) =>
  canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());

test('reduzir movimento deixa tudo estático', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'load' });

  // Controle positivo: o seletor realmente encontra elementos.
  const targets = page.locator('svg *, .gb-bar');
  expect(await targets.count()).toBeGreaterThan(0);

  const animated = await page.evaluate(() =>
    [...document.querySelectorAll('svg *, .gb-bar')]
      .filter((el) => getComputedStyle(el).animationName !== 'none')
      .map((el) => `${el.tagName}.${el.getAttribute('class') ?? ''}`),
  );
  expect(animated).toEqual([]);

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeAttached();
  const first = await snap(canvas);
  // Controle positivo: o canvas não está em branco.
  const blank = await canvas.evaluate((c) => {
    const el = c as HTMLCanvasElement;
    const b = document.createElement('canvas');
    b.width = el.width;
    b.height = el.height;
    return b.toDataURL();
  });
  expect(first).not.toBe(blank);

  await page.waitForTimeout(SNAPSHOT_GAP_MS);
  expect(await snap(canvas)).toBe(first);
});

test('sem reduzir movimento o canvas da Home anima', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'load' });
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeAttached();
  const first = await snap(canvas);
  await page.waitForTimeout(SNAPSHOT_GAP_MS);
  expect(await snap(canvas)).not.toBe(first);
});
