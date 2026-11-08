import { expect, test, type Locator } from '@playwright/test';

// Intervalo entre os dois instantâneos do canvas: longo o bastante para várias
// partículas se moverem (a animação roda a ~60 fps), curto para não alongar o teste.
const SNAPSHOT_GAP_MS = 500;

const snap = (canvas: Locator) => canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());

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

const blankOf = (canvas: Locator) =>
  canvas.evaluate((c) => {
    const el = c as HTMLCanvasElement;
    const b = document.createElement('canvas');
    b.width = el.width;
    b.height = el.height;
    return b.toDataURL();
  });

test('sem reduzir movimento o canvas da Home anima no computador', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'no celular o hero é estático (teste abaixo)');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'load' });
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeAttached();
  const first = await snap(canvas);
  await page.waitForTimeout(SNAPSHOT_GAP_MS);
  expect(await snap(canvas)).not.toBe(first);
});

test('em tela pequena o canvas da Home mostra o gráfico formado e parado', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'só se aplica abaixo de 768 px');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'load' });
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeAttached();
  // O quadro final é desenhado quando o navegador fica ocioso; espera sair do branco.
  const blank = await blankOf(canvas);
  await expect.poll(() => snap(canvas)).not.toBe(blank);
  const first = await snap(canvas);
  await page.waitForTimeout(SNAPSHOT_GAP_MS);
  expect(await snap(canvas)).toBe(first);
});
