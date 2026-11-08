import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchDialogLoader } from './SearchDialogLoader';

// A factory roda a cada tentativa de import: na primeira simula falha de rede/chunk.
const state = vi.hoisted(() => ({ attempts: 0 }));
vi.mock('./SearchDialog', () => {
  state.attempts += 1;
  if (state.attempts === 1) throw new Error('chunk indisponível');
  return {
    SearchDialog: () => <div role="dialog" aria-label="Busca" />,
  };
});

describe('SearchDialogLoader com falha de carregamento', () => {
  it('permite nova tentativa após o import falhar e avisa uma vez', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<SearchDialogLoader />);

    window.dispatchEvent(new Event('open-search'));
    await vi.waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).toBeNull();

    window.dispatchEvent(new Event('open-search'));
    expect(await screen.findByRole('dialog', { name: 'Busca' })).toBeInTheDocument();
    expect(state.attempts).toBe(2);
    warn.mockRestore();
  });
});
