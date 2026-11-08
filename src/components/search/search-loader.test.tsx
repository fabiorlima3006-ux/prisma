import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchDialogLoader } from './SearchDialogLoader';

// Conta quantas vezes o módulo do diálogo é avaliado (a factory roda no primeiro import).
const loads = vi.hoisted(() => ({ count: 0 }));
vi.mock('./SearchDialog', () => {
  loads.count += 1;
  return {
    SearchDialog: ({ defaultOpen }: { defaultOpen?: boolean }) => (
      <div role="dialog" aria-label="Busca">
        {defaultOpen ? 'aberto' : 'fechado'}
      </div>
    ),
  };
});

describe('SearchDialogLoader', () => {
  it('não carrega o diálogo até o primeiro atalho/evento e então o abre', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SearchDialogLoader />
        <input aria-label="Outro campo" />
      </>,
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(loads.count).toBe(0);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Ctrl+K dentro de um campo de digitação não aciona a busca.
    await user.click(screen.getByLabelText('Outro campo'));
    await user.keyboard('{Control>}k{/Control}');
    await new Promise((r) => setTimeout(r, 20));
    expect(loads.count).toBe(0);

    await user.click(document.body);
    await user.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('dialog', { name: 'Busca' })).toHaveTextContent('aberto');
    expect(loads.count).toBe(1);
  });

  it('o evento open-search também carrega e abre', async () => {
    render(<SearchDialogLoader />);
    window.dispatchEvent(new Event('open-search'));
    expect(await screen.findByRole('dialog', { name: 'Busca' })).toHaveTextContent('aberto');
  });
});
