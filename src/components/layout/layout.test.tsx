import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import { Breadcrumbs } from './Breadcrumbs';
import { Disclaimer } from './Disclaimer';
import { Footer } from './Footer';
import { Header } from './Header';
import { PageHeader } from './PageHeader';
import { ThemeToggle } from './ThemeToggle';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

beforeAll(() => {
  // jsdom não implementa matchMedia (usado pelo next-themes)
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  })) as unknown as typeof window.matchMedia;
});

describe('Disclaimer', () => {
  it('traz o aviso padrão completo', () => {
    render(<Disclaimer />);
    expect(screen.getByText(/finalidade educacional e informativa/)).toHaveTextContent(
      'Investimentos envolvem riscos.',
    );
  });
});

describe('Breadcrumbs', () => {
  it('marca o último item como página atual', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: 'Ações', href: '/acoes' },
          { label: 'PETR4' },
        ]}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Trilha de navegação' })).toBeInTheDocument();
    expect(screen.getByText('PETR4')).toHaveAttribute('aria-current', 'page');
  });
});

describe('Header', () => {
  it('abre o menu móvel e devolve o foco ao botão com Esc', async () => {
    const user = userEvent.setup();
    render(<Header />);
    const btn = screen.getByRole('button', { name: /menu/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn).toHaveFocus();
  });

  it('Investimentos é botão (nunca link) e a busca dispara open-search', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    window.addEventListener('open-search', onOpen);
    render(<Header />);
    expect(screen.queryByRole('link', { name: 'Investimentos' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Investimentos/ })).toBeInTheDocument();
    const search = screen.getByRole('button', { name: 'Buscar ativo, tema (Ctrl+K)' });
    expect(search).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K');
    await user.click(search);
    expect(onOpen).toHaveBeenCalledTimes(1);
    window.removeEventListener('open-search', onOpen);
  });
});

describe('ThemeToggle', () => {
  it('tem nome acessível', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: /tema/i })).toBeInTheDocument();
  });
});

describe('PageHeader', () => {
  it('renderiza único h1 e eyebrow em //', () => {
    render(<PageHeader eyebrow="mercados" title="Mercados" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Mercados' })).toBeInTheDocument();
    expect(screen.getByText('// mercados')).toBeInTheDocument();
  });
});

describe('Footer', () => {
  it('traz aviso e atribuição', () => {
    render(<Footer />);
    expect(screen.getByText(/finalidade educacional e informativa/)).toBeInTheDocument();
    expect(screen.getByText(/Banco Central do Brasil \(SGS\)/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade',
    );
  });
});

describe('Header: gaveta móvel', () => {
  function Page() {
    return (
      <>
        <Header />
        <main id="conteudo">conteúdo</main>
        <footer id="rodape">rodapé</footer>
      </>
    );
  }

  it('trava a rolagem, isola a página e move o foco para dentro', async () => {
    const user = userEvent.setup();
    document.body.style.overflow = 'scroll';
    const { unmount } = render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Menu principal' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.getElementById('conteudo')).toHaveAttribute('inert');
    expect(document.getElementById('rodape')).toHaveAttribute('inert');
    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('scroll');
    expect(document.getElementById('conteudo')).not.toHaveAttribute('inert');
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
    unmount();
    expect(document.body.style.overflow).toBe('scroll');
    document.body.style.overflow = '';
  });

  it('fecha ao passar para desktop e devolve o foco ao clicar em link', async () => {
    const user = userEvent.setup();
    const original = window.matchMedia;
    let listener: ((e: { matches: boolean }) => void) | undefined;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => (listener = fn),
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    render(<Page />);
    const btn = screen.getByRole('button', { name: 'Abrir menu' });
    await user.click(btn);
    await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: 'Mercados' }));
    expect(btn).toHaveFocus();
    await user.click(btn);
    act(() => listener?.({ matches: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.getElementById('conteudo')).not.toHaveAttribute('inert');
    window.matchMedia = original;
  });
});
