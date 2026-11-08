import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fixture from '@/lib/data/providers/__fixtures__/bcb-ipca-history.json';
import type { MonthlyPoint } from '@/lib/data/types';
import { formatCurrency, formatNumber } from '@/lib/format';
import { correctByIpca } from '@/lib/finance/inflation';
import { InflationSimulator } from './InflationSimulator';
import { fromSearchParams, parseMonthYear } from './url-state';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

const SERIES: MonthlyPoint[] = (fixture as { data: string; valor: string }[]).map((r) => {
  const [, mm = '', yyyy = ''] = r.data.split('/');
  return { month: `${yyyy}-${mm}`, value: Number(r.valor) / 100 };
});
const META = {
  source: 'bcb' as const,
  isDemo: false,
  asOf: '2026-11-08T12:00:00.000Z',
  attribution: 'Banco Central do Brasil',
};
const LAST = SERIES[SERIES.length - 1]!.month;

const correction = { valor: '1000', de: '01/2024', ate: '04/2024' };
const future = { valor: '1000', anos: '2', inflacao: '5' };

function setup(overrides: Partial<Parameters<typeof InflationSimulator>[0]> = {}) {
  const view = render(
    <InflationSimulator
      series={SERIES}
      meta={META}
      initialTab="corrigir"
      correction={correction}
      future={future}
      inflationNote="IPCA 12 meses (premissa, não previsão)"
      {...overrides}
    />,
  );
  return within(view.container);
}

beforeEach(() => replace.mockClear());

describe('url-state', () => {
  it('lê MM/aaaa e rejeita mês 13', () => {
    expect(parseMonthYear('01/2024')).toBe('2024-01');
    expect(parseMonthYear('13/2024')).toBeNull();
    expect(parseMonthYear('1/2024')).toBeNull();
  });

  it('usa padrões: 10 anos antes do último mês até o último mês', () => {
    const {
      correction: c,
      future: f,
      tab,
    } = fromSearchParams(new URLSearchParams(), {
      lastMonth: '2026-09',
      defaultInflacao: '4,58',
    });
    expect(tab).toBe('corrigir');
    expect(c).toEqual({ valor: '1000', de: '09/2016', ate: '09/2026' });
    expect(f).toEqual({ valor: '1000', anos: '10', inflacao: '4,58' });
  });

  it('lê aba e parâmetros', () => {
    const { tab, future: f } = fromSearchParams(
      new URLSearchParams('aba=futuro&valor=2500.5&anos=3&inflacao=5'),
      { lastMonth: null, defaultInflacao: '' },
    );
    expect(tab).toBe('futuro');
    expect(f).toEqual({ valor: '2500,5', anos: '3', inflacao: '5' });
  });
});

describe('InflationSimulator', () => {
  it('corrige de 01/2024 a 04/2024 com o fator do IPCA', () => {
    const ui = setup();
    const r = correctByIpca(SERIES, 1000, '2024-01', '2024-04');
    if (!r.ok) throw new Error('fixture');
    expect(ui.getByTestId('corrected-value')).toHaveTextContent(
      formatCurrency(r.corrected).replace(/\s/g, ' '),
    );
    expect(ui.getByTestId('correction-factor')).toHaveTextContent(formatNumber(r.factor, 6));
    expect(ui.getByText(/3 meses/)).toBeInTheDocument();
    expect(
      ui.getByText(
        'Considera o IPCA dos meses seguintes ao mês inicial até o mês final, inclusive.',
      ),
    ).toBeInTheDocument();
    expect(ui.getByText(/Banco Central do Brasil — SGS 433/)).toBeInTheDocument();
  });

  it('mês 13 dá erro de formato', async () => {
    const user = userEvent.setup();
    const ui = setup();
    const field = ui.getByLabelText('Mês inicial (MM/aaaa)');
    await user.clear(field);
    await user.type(field, '13/2024');
    expect(ui.getByText('Use o formato MM/aaaa, com mês de 01 a 12')).toBeInTheDocument();
  });

  it('fim antes do início dá erro de ordem', async () => {
    const user = userEvent.setup();
    const ui = setup();
    const field = ui.getByLabelText('Mês final (MM/aaaa)');
    await user.clear(field);
    await user.type(field, '12/2023');
    expect(ui.getByText('O mês final deve ser igual ou posterior ao inicial')).toBeInTheDocument();
  });

  it('fora da série dá erro de período', async () => {
    const user = userEvent.setup();
    const ui = setup();
    const field = ui.getByLabelText('Mês final (MM/aaaa)');
    await user.clear(field);
    await user.type(field, '01/2030');
    const [yyyy, mm] = LAST.split('-');
    expect(
      ui.getByText(`Período fora da série disponível (07/1994 a ${mm}/${yyyy})`),
    ).toBeInTheDocument();
  });

  it('série indisponível: aviso, sem formulário de correção, e a aba Futuro funciona', async () => {
    const user = userEvent.setup();
    const ui = setup({ series: null, meta: null });
    expect(ui.getByText('Dado indisponível no momento')).toBeInTheDocument();
    expect(ui.queryByLabelText('Mês inicial (MM/aaaa)')).toBeNull();
    await user.click(ui.getByRole('tab', { name: 'Poder de compra no futuro' }));
    expect(ui.getByTestId('needed-future')).toHaveTextContent('1.102,50');
  });

  it('aba Futuro com R$ 1.000, 2 anos e 5% mostra 1.102,50 e 907,03', () => {
    const ui = setup({ initialTab: 'futuro' });
    expect(ui.getByTestId('needed-future')).toHaveTextContent('1.102,50');
    expect(ui.getByTestId('today-equivalent')).toHaveTextContent('907,03');
    expect(ui.getAllByText(/premissa, não previsão/).length).toBeGreaterThan(0);
  });
});
