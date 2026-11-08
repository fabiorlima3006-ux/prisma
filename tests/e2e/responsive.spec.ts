import { expect, test } from '@playwright/test';
import { KEY_PAGES } from './routes';

for (const route of KEY_PAGES) {
  test(`${route} não rola na horizontal em 375px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile');
    await page.goto(route);
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
}
