import { render, within } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fixture from '@/lib/data/providers/__fixtures__/bcb-ipca-history.json';
import type { DataResult, MonthlyPoint } from '@/lib/data/types';
import { formatCurrency, formatNumber } from '@/lib/format';
import { correctByIpca } from '@/lib/finance/inflation';
import { InflationSimulator } from './InflationSimulator';
import { defaultPeriod, fromSearchParams, parseMonthYear } from './url-state';

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

const OK: DataResult<MonthlyPoint[]> = { status: 'ok', data: SERIES, meta: META };
const UNAVAILABLE: DataResult<MonthlyPoint[]> = {
  status: 'unavailable',
  reason: 'fetch-failed',
  source: 'bcb',
  attribution: 'Banco Central do Brasil',
};

const correction = { valor: '1000', de: '01/2024', ate: '04/2024' };
const future = { valor: '1000', anos: '2', inflacao: '5' };

async function setup(overrides: Partial<Parameters<typeof InflationSimulator>[0]> = {}) {
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(
      <InflationSimulator
        history={Promise.resolve(OK)}
        initialTab="corrigir"
        correction={correction}
        future={future}
        inflationNote="IPCA 12 meses (premissa, não previsão)"
        {...overrides}
      />,
    );
  });
  return within(view.container);
}

const replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
beforeEach(() => replaceState.mockClear());

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
      defaultInflacao: '4,58',
    });
    expect(tab).toBe('corrigir');
    expect(c).toEqual({ valor: '1000', de: null, ate: null });
    expect(defaultPeriod('2026-09')).toEqual({ de: '09/2016', ate: '09/2026' });
    expect(f).toEqual({ valor: '1000', anos: '10', inflacao: '4,58' });
  });

  it('aba desconhecida cai em corrigir', () => {
    expect(fromSearchParams(new URLSearchParams('aba=x'), { defaultInflacao: '' }).tab).toBe(
      'corrigir',
    );
  });

  it('lê aba e parâmetros', () => {
    const { tab, future: f } = fromSearchParams(
      new URLSearchParams('aba=futuro&valor=2500.5&anos=3&inflacao=5'),
      { defaultInflacao: '' },
    );
    expect(tab).toBe('futuro');
    expect(f).toEqual({ valor: '2500,5', anos: '3', inflacao: '5' });
  });
});

describe('InflationSimulator', () => {
  it('corrige de 01/2024 a 04/2024 com o fator do IPCA', async () => {
    const ui = await setup();
    await ui.findByTestId('corrected-value');
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
    const ui = await setup();
    await ui.findByLabelText('Mês inicial (MM/aaaa)');
    const field = ui.getByLabelText('Mês inicial (MM/aaaa)');
    await user.clear(field);
    await user.type(field, '13/2024');
    expect(ui.getByText('Use o formato MM/aaaa, com mês de 01 a 12')).toBeInTheDocument();
  });

  it('fim antes do início dá erro de ordem', async () => {
    const user = userEvent.setup();
    const ui = await setup();
    await ui.findByLabelText('Mês inicial (MM/aaaa)');
    const field = ui.getByLabelText('Mês final (MM/aaaa)');
    await user.clear(field);
    await user.type(field, '12/2023');
    expect(ui.getByText('O mês final deve ser igual ou posterior ao inicial')).toBeInTheDocument();
  });

  it('fora da série dá erro de período', async () => {
    const user = userEvent.setup();
    const ui = await setup();
    await ui.findByLabelText('Mês inicial (MM/aaaa)');
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
    const ui = await setup({ history: Promise.resolve(UNAVAILABLE) });
    expect(await ui.findByText('Dado indisponível no momento')).toBeInTheDocument();
    expect(ui.queryByLabelText('Mês inicial (MM/aaaa)')).toBeNull();
    await user.click(ui.getByRole('tab', { name: 'Poder de compra no futuro' }));
    expect(ui.getByTestId('needed-future')).toHaveTextContent('1.102,50');
  });

  it('mostra "Carregando dados do IPCA…" enquanto a série chega e depois o formulário', async () => {
    let resolve!: (r: DataResult<MonthlyPoint[]>) => void;
    const pending = new Promise<DataResult<MonthlyPoint[]>>((r) => (resolve = r));
    const ui = await setup({ history: pending });
    expect(ui.getByText('Carregando dados do IPCA…')).toBeInTheDocument();
    // A aba Futuro e o resto não esperam a série.
    expect(ui.getByTestId('needed-future')).toHaveTextContent('1.102,50');
    await act(async () => resolve(OK));
    expect(await ui.findByTestId('corrected-value')).toBeInTheDocument();
    expect(ui.queryByText('Carregando dados do IPCA…')).toBeNull();
  });

  it('editar escreve a URL com history.replaceState (sem navegar na montagem)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const ui = await setup();
    const field = await ui.findByLabelText('Mês final (MM/aaaa)');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(replaceState).not.toHaveBeenCalled();
    await user.clear(field);
    await user.type(field, '05/2024');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(String(replaceState.mock.calls[0]?.[2])).toContain('ate=05%2F2024');
    vi.useRealTimers();
  });

  it('prazo da aba Futuro: inteiro de 1 a 50 anos', async () => {
    const msg = 'Informe um prazo entre 1 e 50 anos';
    const run = (anos: string) => setup({ initialTab: 'futuro', future: { ...future, anos } });
    expect((await run('0,5')).getByText(msg)).toBeInTheDocument();
    expect((await run('51')).getByText(msg)).toBeInTheDocument();
    const ok = await run('50');
    expect(ok.queryByText(msg)).toBeNull();
    expect(ok.getByTestId('needed-future')).toBeInTheDocument();
  });

  it('aba Futuro com R$ 1.000, 2 anos e 5% mostra 1.102,50 e 907,03', async () => {
    const ui = await setup({ initialTab: 'futuro' });
    expect(ui.getByTestId('needed-future')).toHaveTextContent('1.102,50');
    expect(ui.getByTestId('today-equivalent')).toHaveTextContent('907,03');
    expect(ui.getAllByText(/premissa, não previsão/).length).toBeGreaterThan(0);
  });

  describe('aba Futuro: URL e inflação padrão', () => {
    async function edit(inflacao: string, typed: string | null, defaultInflation?: string) {
      replaceState.mockClear();
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const ui = await setup({
        initialTab: 'futuro',
        future: { ...future, inflacao },
        defaultInflation,
      });
      await user.clear(ui.getByLabelText('Prazo (anos)'));
      await user.type(ui.getByLabelText('Prazo (anos)'), '3');
      if (typed !== null) {
        await user.clear(ui.getByLabelText('Inflação anual esperada (premissa)'));
        if (typed !== '')
          await user.type(ui.getByLabelText('Inflação anual esperada (premissa)'), typed);
      }
      act(() => {
        vi.advanceTimersByTime(300);
      });
      vi.useRealTimers();
      expect(replaceState).toHaveBeenCalled();
      return String(replaceState.mock.calls.at(-1)?.[2]);
    }

    it('igual ao padrão: não grava inflacao', async () => {
      expect(await edit('4,58', null, '4,58')).not.toContain('inflacao');
    });

    it('diferente do padrão: grava inflacao', async () => {
      expect(await edit('4,58', '6,5', '4,58')).toContain('inflacao=6.5');
    });

    it('campo vazio com padrão disponível: grava inflacao= (desligado)', async () => {
      expect(await edit('4,58', '', '4,58')).toMatch(/inflacao=(&|$)/);
    });

    it('campo vazio sem padrão: não grava', async () => {
      expect(await edit('', null, undefined)).not.toContain('inflacao');
    });
  });

  it('BCB fora e campo vazio: sem erro antes de mexer, com pedido neutro no resultado', async () => {
    const user = userEvent.setup();
    const ui = await setup({ initialTab: 'futuro', future: { ...future, inflacao: '' } });
    expect(ui.queryByText('Informe uma premissa de inflação')).toBeNull();
    expect(ui.getByLabelText('Inflação anual esperada (premissa)')).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(ui.getByText('Informe uma premissa de inflação para calcular')).toBeInTheDocument();
    expect(ui.queryByTestId('needed-future')).toBeNull();
    const field = ui.getByLabelText('Inflação anual esperada (premissa)');
    await user.type(field, '5');
    await user.clear(field);
    expect(ui.getByText('Informe uma premissa de inflação')).toBeInTheDocument();
  });
});
