import { expect, test, type Locator, type Page } from '@playwright/test';

const BOX = 'Buscar ativos, ferramentas e artigos';

/** O atalho só vale depois da hidratação; repete até o diálogo abrir. */
async function openWithShortcut(page: Page, box: Locator) {
  await expect(async () => {
    await page.keyboard.press('Control+k');
    await expect(box).toBeVisible({ timeout: 1000 });
  }).toPass();
}

test('Ctrl+K busca PETR4 e abre a página do ativo', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'atalho de teclado');
  await page.goto('/');
  const box = page.getByRole('combobox', { name: BOX });
  await openWithShortcut(page, box);
  await expect(box).toBeFocused();
  await box.fill('PETR4');
  await expect(page.getByRole('option').first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/acoes\/petr4$/);
});

test('busca por "inflação" encontra o artigo de juros compostos', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'atalho de teclado');
  await page.goto('/');
  const box = page.getByRole('combobox', { name: BOX });
  await openWithShortcut(page, box);
  await box.fill('inflação');
  const article = page.getByRole('group', { name: 'Artigos' }).getByRole('option').first();
  await expect(article).toContainText(/juros compostos/i);
  await article.click();
  await expect(page).toHaveURL(/\/educacao\/iniciante\/juros-compostos-e-inflacao$/);
});

test('botão de busca do cabeçalho abre o diálogo', async ({ page }) => {
  await page.goto('/');
  const box = page.getByRole('combobox', { name: BOX });
  // O clique só vale depois da hidratação; repete até o diálogo abrir.
  await expect(async () => {
    await page.getByRole('button', { name: 'Buscar ativo, tema (Ctrl+K)' }).click();
    await expect(box).toBeVisible({ timeout: 1000 });
  }).toPass();
});

test('/busca: trilha de navegação e formulário GET do design system', async ({ page }) => {
  await page.goto('/busca?q=petr4');
  const crumbs = page.getByRole('navigation', { name: 'Trilha de navegação' });
  await expect(crumbs.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/');
  await expect(crumbs.getByText('Busca')).toHaveAttribute('aria-current', 'page');
  const form = page.getByRole('search');
  await expect(form.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('petr4');
  await expect(form.getByRole('button', { name: 'Buscar' })).toHaveAttribute('type', 'submit');
  await expect(page.getByRole('link', { name: /PETR4/ }).first()).toBeVisible();
});
