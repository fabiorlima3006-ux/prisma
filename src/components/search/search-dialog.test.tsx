import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SearchEntry } from '@/lib/search/search';
import { SearchDialog } from './SearchDialog';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const index: SearchEntry[] = [
  { type: 'asset', title: 'PETR4', subtitle: 'Petrobras PN', href: '/acoes/petr4', keywords: ['petrobras', 'acoes'] },
  { type: 'tool', title: 'Simulador de juros compostos', href: '/simuladores/juros-compostos', keywords: ['juros'] },
];

describe('SearchDialog', () => {
  it('abre com Ctrl+K, navega, seleciona e fecha com Esc', async () => {
    const user = userEvent.setup();
    render(<SearchDialog index={index} />);
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.type(screen.getByRole('combobox'), 'petr4');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /PETR4/ })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Enter navega para o resultado ativo', async () => {
    const user = userEvent.setup();
    push.mockClear();
    render(<SearchDialog index={index} />);
    await user.keyboard('{Control>}k{/Control}');
    await user.type(screen.getByRole('combobox'), 'petr4');
    await user.keyboard('{Enter}');
    expect(push).toHaveBeenCalledWith('/acoes/petr4');
  });

  it('abre com o evento open-search', async () => {
    render(<SearchDialog index={index} />);
    window.dispatchEvent(new Event('open-search'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('ignora Ctrl+K enquanto digita em outro campo', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="outro" />
        <SearchDialog index={index} />
      </>,
    );
    await user.click(screen.getByLabelText('outro'));
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('sem resultados mostra mensagem e link para /busca', async () => {
    const user = userEvent.setup();
    render(<SearchDialog index={index} />);
    await user.keyboard('{Control>}k{/Control}');
    await user.type(screen.getByRole('combobox'), 'zzzz');
    expect(screen.getByText(/Nenhum resultado para/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver todos os resultados' })).toHaveAttribute('href', '/busca?q=zzzz');
  });
});
