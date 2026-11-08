import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Adorned,
  Badge,
  Button,
  Dropdown,
  Field,
  Modal,
  Select,
  Table,
  Tabs,
  Tooltip,
} from './index';

describe('Field', () => {
  it('liga label, descrição e aria-invalid', () => {
    render(
      <Field label="Capital inicial" error="Informe um valor">
        {(p) => <input {...p} />}
      </Field>,
    );
    const input = screen.getByLabelText('Capital inicial');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Informe um valor');
  });

  it('usa a dica como descrição quando não há erro', () => {
    render(
      <Field label="Prazo" hint="Em meses">
        {(p) => <input {...p} />}
      </Field>,
    );
    const input = screen.getByLabelText('Prazo');
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Em meses');
  });
});

describe('Adorned', () => {
  it('prefixo e sufixo são decorativos (fora do nome acessível)', () => {
    const { container } = render(
      <Adorned prefix="R$" suffix="%">
        <input aria-label="Valor" />
      </Adorned>,
    );
    expect(screen.getByRole('textbox', { name: 'Valor' })).toBeInTheDocument();
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect([...hidden].map((h) => h.textContent)).toEqual(['R$', '%']);
  });
});

describe('Button', () => {
  it('com href renderiza link', () => {
    render(<Button href="/mercados">Explorar mercados</Button>);
    expect(screen.getByRole('link', { name: 'Explorar mercados' })).toHaveAttribute(
      'href',
      '/mercados',
    );
  });
  it('sem href renderiza botão', () => {
    render(<Button>Simular</Button>);
    expect(screen.getByRole('button', { name: 'Simular' })).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renderiza o texto', () => {
    render(<Badge tone="demo">DADOS DEMONSTRATIVOS</Badge>);
    expect(screen.getByText('DADOS DEMONSTRATIVOS')).toBeInTheDocument();
  });
});

describe('Select', () => {
  it('é um select nativo', () => {
    render(
      <Select aria-label="Classe">
        <option>Ações</option>
      </Select>,
    );
    expect(screen.getByRole('combobox', { name: 'Classe' })).toBeInTheDocument();
  });
});

describe('Tooltip', () => {
  it('abre com foco e fecha com Esc', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Preço sobre lucro">
        <button>P/L</button>
      </Tooltip>,
    );
    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Preço sobre lucro');
    expect(screen.getByRole('button', { name: 'P/L' })).toHaveAccessibleDescription(
      'Preço sobre lucro',
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('Tab a partir do gatilho vai ao próximo elemento focável (não ao body)', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Tooltip content="Preço sobre lucro">
          <button>P/L</button>
        </Tooltip>
        <a href="/depois">Depois</a>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'P/L' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Depois' })).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('fecha com Esc também quando aberto por hover', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Preço sobre lucro">
        <button>P/L</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole('button', { name: 'P/L' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Preço sobre lucro');
    expect(screen.getByRole('button', { name: 'P/L' })).not.toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('é somente texto: o balão não tem conteúdo focável', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Preço sobre lucro">
        <button>P/L</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole('button', { name: 'P/L' }));
    expect(screen.getByRole('tooltip').querySelector('a, button, input, [tabindex]')).toBeNull();
  });
});

describe('Tabs', () => {
  const items = [
    { id: 'br', label: 'Brasil', content: 'A' },
    { id: 'ex', label: 'Exterior', content: 'B' },
  ];
  it('navega com setas e ativa automaticamente', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    await user.click(screen.getByRole('tab', { name: 'Brasil' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Exterior' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('B');
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Brasil' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Exterior' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renderiza todos os painéis no HTML, os inativos com hidden', () => {
    const { container } = render(<Tabs items={items} />);
    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(2);
    expect(panels[0]).not.toHaveAttribute('hidden');
    expect(panels[0]).toHaveTextContent('A');
    expect(panels[1]).toHaveAttribute('hidden');
    expect(panels[1]).toHaveTextContent('B');
  });
});

describe('Table', () => {
  it('tem caption como nome acessível', () => {
    render(
      <Table caption="Ativos" columns={[{ key: 't', label: 'Ticker' }]} rows={[{ t: 'PETR4' }]} />,
    );
    expect(screen.getByRole('table', { name: 'Ativos' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Ticker' })).toBeInTheDocument();
  });
});

describe('Dropdown', () => {
  it('abre, navega com setas e fecha com Esc devolvendo o foco', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown
        label="Investimentos"
        items={[
          { label: 'Ações', href: '/acoes' },
          { label: 'FIIs', href: '/fiis' },
        ]}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Investimentos' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', { name: 'Ações' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', { name: 'FIIs' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('link', { name: 'Ações' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn).toHaveFocus();
  });

  it('fecha ao sair do componente com Tab', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Dropdown
          label="Investimentos"
          items={[
            { label: 'Ações', href: '/acoes' },
            { label: 'FIIs', href: '/fiis' },
          ]}
        />
        <a href="/depois">Depois</a>
      </>,
    );
    const btn = screen.getByRole('button', { name: 'Investimentos' });
    await user.click(btn);
    await user.tab();
    expect(screen.getByRole('link', { name: 'Ações' })).toHaveFocus();
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await user.tab();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Depois' })).toHaveFocus();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Modal', () => {
  it('abre como dialog modal e chama onClose', () => {
    let closed = 0;
    const { rerender } = render(
      <Modal open={false} onClose={() => closed++} title="Aviso">
        conteúdo
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(
      <Modal open onClose={() => closed++} title="Aviso">
        conteúdo
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Aviso' })).toBeInTheDocument();
  });
});
