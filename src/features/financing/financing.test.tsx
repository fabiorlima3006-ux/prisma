import { act, fireEvent, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TOOLS } from '@/lib/config/tools';
import { compareSystems } from '@/lib/finance/financing';
import { formatCurrency } from '@/lib/format';
import { FinancingForm } from './FinancingForm';
import {
  DEFAULT_VALUES,
  fromSearchParams,
  toSearchParams,
  validateValues,
  type FormValues,
} from './url-state';

const SAC_TEXT =
  'No SAC as parcelas começam maiores e diminuem; os juros totais tendem a ser menores. Na Price as parcelas são iguais; os juros totais tendem a ser maiores.';
const SCOPE_TEXT =
  'Seguros, taxas administrativas, correção pela TR, IOF e CET não estão incluídos; a parcela real do contrato será diferente.';

const nbsp = (s: string) => s.replace(/\s/g, ' ');

function setup(initial: Partial<FormValues> = {}) {
  const { container } = render(<FinancingForm initial={{ ...DEFAULT_VALUES, ...initial }} />);
  return within(container);
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('url-state', () => {
  it('padrões: R$ 300.000, 1% ao mês, 360 meses, extra 0', () => {
    expect(DEFAULT_VALUES).toEqual({
      valor: '300000',
      taxa: '1',
      periodo: 'mes',
      prazo: '360',
      extra: '0',
    });
    expect(validateValues(DEFAULT_VALUES).input).toEqual({
      principal: 300000,
      rate: 0.01,
      ratePeriod: 'month',
      months: 360,
      extraMonthly: 0,
    });
  });

  it('faz ida e volta com a URL (taxa em %, período mes|ano)', () => {
    const input = validateValues({
      ...DEFAULT_VALUES,
      taxa: '12,5',
      periodo: 'ano',
      extra: '500',
    }).input!;
    const sp = toSearchParams(input);
    expect(sp.get('taxa')).toBe('12.5');
    expect(sp.get('periodo')).toBe('ano');
    expect(fromSearchParams(sp).input).toEqual(input);
  });

  it('valor inválido vira erro no campo; período desconhecido volta ao padrão', () => {
    expect(validateValues({ ...DEFAULT_VALUES, valor: 'abc' }).errors?.valor).toBeTruthy();
    expect(validateValues({ ...DEFAULT_VALUES, prazo: '421' }).errors?.prazo).toBeTruthy();
    const sp = new URLSearchParams({ periodo: 'dia' });
    expect(fromSearchParams(sp).values.periodo).toBe('mes');
  });
});

describe('FinancingForm', () => {
  it('PV 100.000, 1% e 12 meses: Price 8.884,88 e SAC 9.333,33', () => {
    const ui = setup({ valor: '100000', prazo: '12' });
    expect(ui.getByTestId('price-first')).toHaveTextContent(nbsp(formatCurrency(8884.88)));
    expect(ui.getByTestId('sac-first')).toHaveTextContent(nbsp(formatCurrency(9333.33)));
    expect(ui.getByTestId('price-first').textContent).toContain('8.884,88');
    expect(ui.getByTestId('sac-first').textContent).toContain('9.333,33');
    expect(ui.queryByText(/NaN|Infinity|undefined/)).toBeNull();
  });

  it('sem extra não mostra a economia; com extra mostra juros e meses', () => {
    const without = setup();
    expect(without.queryByText('Economia de juros')).toBeNull();
    const values = { valor: '100000', prazo: '120', extra: '500' };
    const ui = setup(values);
    const r = compareSystems(validateValues({ ...DEFAULT_VALUES, ...values }).input!);
    expect(ui.getAllByText('Economia de juros')).toHaveLength(2);
    expect(ui.getByTestId('sac-saving-interest')).toHaveTextContent(
      nbsp(formatCurrency(r.savings!.sac.interest)),
    );
    expect(ui.getByTestId('price-saving-interest')).toHaveTextContent(
      nbsp(formatCurrency(r.savings!.price.interest)),
    );
    expect(ui.getAllByText('Economia de prazo')).toHaveLength(2);
  });

  it('mostra os dois textos fixos', () => {
    const ui = setup();
    expect(ui.getByText(SAC_TEXT)).toBeInTheDocument();
    expect(ui.getByText(SCOPE_TEXT)).toBeInTheDocument();
  });

  it('mostra SAC e Price, tabela anual e tabela mensal dentro de details, sem "melhor"', () => {
    const ui = setup({ prazo: '24' });
    expect(ui.getByRole('heading', { name: 'SAC' })).toBeInTheDocument();
    expect(ui.getByRole('heading', { name: 'Price' })).toBeInTheDocument();
    expect(ui.getAllByRole('table', { hidden: true }).length).toBeGreaterThanOrEqual(4);
    const details = ui.getAllByText(/Tabela mensal/)[0]!.closest('details');
    expect(details).not.toBeNull();
    expect(ui.queryByText(/melhor/i)).toBeNull();
  });

  it('entrada inválida mostra erro de campo e esconde o resultado', async () => {
    const user = userEvent.setup();
    const ui = setup({ prazo: '24' });
    const prazo = ui.getByLabelText('Prazo (meses)');
    await user.clear(prazo);
    await user.click(prazo);
    await user.paste('500');
    expect(ui.queryByTestId('sac-first')).toBeNull();
    expect(ui.getByText(/entre 1 e 420 meses/)).toBeInTheDocument();
    const valor = ui.getByLabelText('Valor financiado');
    await user.clear(valor);
    await user.click(valor);
    await user.paste('abc');
    expect(ui.getByText('Informe um número válido')).toBeInTheDocument();
  });

  it('no padrão de 360 meses, digitar atualiza o resultado', async () => {
    const user = userEvent.setup();
    const ui = setup();
    const before = ui.getByTestId('sac-total-interest').textContent;
    const valor = ui.getByLabelText('Valor financiado');
    await user.clear(valor);
    await user.click(valor);
    await user.paste('200000');
    await waitFor(() => expect(ui.getByTestId('sac-total-interest').textContent).not.toBe(before));
    const input = validateValues({ ...DEFAULT_VALUES, valor: '200000' }).input!;
    expect(ui.getByTestId('sac-first')).toHaveTextContent(
      nbsp(formatCurrency(compareSystems(input).sac.firstInstallment)),
    );
  });

  it('o gráfico usa um ponto por ano, não por mês', () => {
    const ui = setup();
    const tables = ui.getAllByRole('table', { hidden: true });
    const chartTable = tables.find((t) =>
      t.querySelector('caption')?.textContent?.startsWith('Evolução'),
    )!;
    expect(chartTable.querySelectorAll('tbody tr')).toHaveLength(30);
  });

  it('a tabela mensal só é montada depois de abrir o details', async () => {
    const ui = setup({ prazo: '24' });
    const caption = /Parcelas mês a mês, sistema SAC/;
    expect(ui.queryByText(caption)).toBeNull();
    fireEvent.click(ui.getByText('Tabela mensal (SAC)'));
    await waitFor(() => expect(ui.getByText(caption)).toBeInTheDocument());
  });

  it('com extra, a tabela mensal fecha as contas: Parcela = Juros + Amortização e Pago = Parcela + Extra', async () => {
    const ui = setup({ valor: '100000', prazo: '24', extra: '500' });
    fireEvent.click(ui.getByText('Tabela mensal (SAC)'));
    const table = await waitFor(() => {
      const t = ui
        .getAllByRole('table', { hidden: true })
        .find((x) => x.querySelector('caption')?.textContent?.includes('mês a mês, sistema SAC'));
      expect(t).toBeTruthy();
      return t!;
    });
    const headers = [...table.querySelectorAll('thead th')].map((h) => h.textContent);
    expect(headers).toEqual([
      'Mês',
      'Parcela',
      'Juros',
      'Amortização',
      'Extra',
      'Pago no mês',
      'Saldo',
    ]);
    const r = compareSystems(
      validateValues({ ...DEFAULT_VALUES, valor: '100000', prazo: '24', extra: '500' }).input!,
    ).sac.rows[0]!;
    const cells = [...table.querySelectorAll('tbody tr')[0]!.querySelectorAll('td')].map((c) =>
      nbsp(c.textContent ?? ''),
    );
    expect(cells[1]).toBe(nbsp(formatCurrency(r.installment)));
    expect(cells[3]).toBe(nbsp(formatCurrency(r.amortization)));
    expect(cells[4]).toBe(nbsp(formatCurrency(r.extra)));
    expect(cells[5]).toBe(nbsp(formatCurrency(r.installment + r.extra)));
    expect(r.installment).toBeCloseTo(r.interest + r.amortization, 6);
  });

  it('com extra, a coluna anual de amortização avisa que inclui o extra; sem extra, não', () => {
    const withExtra = setup({ valor: '100000', prazo: '24', extra: '500' });
    expect(withExtra.getAllByText('Amortização (inclui extra)').length).toBeGreaterThan(0);
    const without = setup({ valor: '100000', prazo: '24', extra: '0' });
    expect(without.queryByText('Amortização (inclui extra)')).toBeNull();
  });

  it('URL: replaceState não é chamado na montagem e é chamado após editar + debounce', async () => {
    const spy = vi.spyOn(window.history, 'replaceState');
    const ui = setup({ prazo: '24' });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 450));
    });
    expect(spy).not.toHaveBeenCalled();
    const user = userEvent.setup();
    const prazo = ui.getByLabelText('Prazo (meses)');
    await user.clear(prazo);
    await user.click(prazo);
    await user.paste('120');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 450));
    });
    expect(spy).toHaveBeenCalled();
    const last = spy.mock.calls.at(-1)!;
    expect(String(last[2])).toContain('prazo=120');
  });
});

describe('TOOLS', () => {
  it('financiamento e amortização são uma entrada só, disponível', () => {
    const t = TOOLS.filter((x) => x.id === 'financiamento');
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({
      title: 'Financiamento: SAC e Price',
      href: '/simuladores/financiamento',
      status: 'available',
    });
    expect(TOOLS.some((x) => x.id === 'amortizacao')).toBe(false);
    expect(t[0]!.keywords).toEqual(expect.arrayContaining(['financiamento', 'sac', 'price']));
  });
});
