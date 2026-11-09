import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompoundInterestInput } from '@/lib/finance/compound-interest';
import { CompoundInterestForm } from './CompoundInterestForm';
import { CompoundInterestResult } from './CompoundInterestResult';
import { DEFAULT_VALUES, fromSearchParams, toSearchParams, validateValues } from './url-state';

// A URL é reescrita com history.replaceState (sem navegação); o teste observa essa chamada.
const replace = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

// O desenho do Recharts (carregado sob demanda) é substituído por um componente vazio: ele não é o
// assunto destes testes (tem os próprios em charts.test.tsx) e redesenhar o SVG a cada tecla
// custava ~20 ms em jsdom, o que sob carga paralela (npm test) estourava os 5 s do teste de digitação,
// que seguia digitando no DOM do teste seguinte. A moldura (figura e tabela para leitores de tela)
// continua real.
vi.mock('@/components/charts/recharts-impl', () => ({
  StackedAreaChartImpl: () => null,
}));

// Aquecimento: a primeira montagem do formulário em jsdom (zod, JIT) custa ~0,5 s.
beforeAll(() => {
  render(<CompoundInterestForm initial={DEFAULT_VALUES} />).unmount();
});

beforeEach(() => replace.mockClear());

describe('url-state', () => {
  const inp: CompoundInterestInput = {
    initial: 1500.5,
    monthlyContribution: 250,
    rate: 0.125,
    ratePeriod: 'year',
    months: 36,
  };

  it('faz ida e volta entre input e URL', () => {
    const sp = toSearchParams(inp);
    expect(sp.get('taxa')).toBe('12.5');
    expect(sp.get('periodo')).toBe('ano');
    expect(fromSearchParams(sp).input).toEqual(inp);
  });

  it('prazo em anos multiplica por 12 e aceita vírgula', () => {
    const { input, values } = fromSearchParams(
      new URLSearchParams('capital=1000&aporte=0&taxa=1,5&periodo=mes&prazo=2&unidade=anos'),
    );
    expect(input?.months).toBe(24);
    expect(input?.rate).toBeCloseTo(0.015);
    expect(values.unidade).toBe('anos');
  });

  it('prazo fracionário em anos é convertido para meses inteiros, com nota', () => {
    const v = validateValues({ ...DEFAULT_VALUES, prazo: '1,3', unidade: 'anos' });
    expect(v.input?.months).toBe(16);
    expect(v.notes.prazo).toBe('convertido para 16 meses');
    // Na URL vai em meses (16 não é múltiplo de 12).
    const sp = toSearchParams(v.input!, 'anos');
    expect(sp.get('prazo')).toBe('16');
    expect(sp.get('unidade')).toBe('meses');
    const exact = validateValues({ ...DEFAULT_VALUES, prazo: '1,5', unidade: 'anos' });
    expect(exact.input?.months).toBe(18);
    expect(exact.notes.prazo).toBeUndefined();
    expect(
      validateValues({ ...DEFAULT_VALUES, prazo: '2', unidade: 'anos' }).notes.prazo,
    ).toBeUndefined();
  });

  it('entrada inválida dá input nulo; sem parâmetros usa os padrões', () => {
    expect(fromSearchParams(new URLSearchParams('capital=abc')).input).toBeNull();
    const d = fromSearchParams(new URLSearchParams());
    expect(d.values).toEqual(DEFAULT_VALUES);
    expect(d.input).not.toBeNull();
  });
});

describe('CompoundInterestForm', () => {
  it('calcula o saldo final digitando nos campos', async () => {
    const user = userEvent.setup();
    render(<CompoundInterestForm initial={DEFAULT_VALUES} />);
    await user.clear(screen.getByLabelText('Capital inicial'));
    await user.type(screen.getByLabelText('Capital inicial'), '1.000,00');
    await user.clear(screen.getByLabelText('Aporte mensal'));
    await user.type(screen.getByLabelText('Aporte mensal'), '100');
    await user.clear(screen.getByLabelText('Taxa de juros'));
    await user.type(screen.getByLabelText('Taxa de juros'), '1');
    await user.selectOptions(screen.getByLabelText('Período da taxa'), 'mes');
    await user.clear(screen.getByLabelText('Prazo'));
    await user.type(screen.getByLabelText('Prazo'), '12');
    expect(await screen.findByTestId('final-balance')).toHaveTextContent('2.395,08');
  });

  it('mostra erro por campo e nunca exibe NaN', async () => {
    const user = userEvent.setup();
    render(<CompoundInterestForm initial={DEFAULT_VALUES} />);
    expect(await screen.findByTestId('final-balance')).toHaveTextContent('2.395,08');

    await user.clear(screen.getByLabelText('Prazo'));
    await user.type(screen.getByLabelText('Prazo'), 'abc');
    expect(screen.getByLabelText('Prazo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Informe um número válido')).toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).toBeNull();
    expect(screen.queryByTestId('final-balance')).toBeNull();
  });

  it('prazo 1,3 anos calcula com 16 meses e mostra a nota no campo', async () => {
    const user = userEvent.setup();
    render(<CompoundInterestForm initial={DEFAULT_VALUES} />);
    await user.selectOptions(screen.getByLabelText('Unidade do prazo'), 'anos');
    await user.clear(screen.getByLabelText('Prazo'));
    await user.type(screen.getByLabelText('Prazo'), '1,3');
    expect(screen.getByLabelText('Prazo')).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Prazo')).toHaveAccessibleDescription('convertido para 16 meses');
    expect(await screen.findByTestId('final-balance')).toBeInTheDocument();
  });

  it('gráfico e tabela anual rotulam ano fracionário em pt-BR', () => {
    render(
      <CompoundInterestResult
        input={{
          initial: 1000,
          monthlyContribution: 0,
          rate: 0.01,
          ratePeriod: 'month',
          months: 30,
        }}
      />,
    );
    expect(screen.getByRole('cell', { name: 'Ano 2,5' })).toBeInTheDocument();
    expect(screen.queryByText(/Ano 2\.5/)).toBeNull();
    expect(screen.getByRole('cell', { name: '2,5' })).toBeInTheDocument();
  });

  it('mostra erro do Zod no campo certo (taxa acima do limite)', async () => {
    const user = userEvent.setup();
    render(<CompoundInterestForm initial={DEFAULT_VALUES} />);
    await user.clear(screen.getByLabelText('Taxa de juros'));
    await user.type(screen.getByLabelText('Taxa de juros'), '150');
    expect(screen.getByLabelText('Taxa de juros')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Taxa acima do limite permitido')).toBeInTheDocument();
  });

  it('atualiza a URL com debounce de 300 ms só quando válido', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CompoundInterestForm initial={DEFAULT_VALUES} />);
    await user.clear(screen.getByLabelText('Aporte mensal'));
    await user.type(screen.getByLabelText('Aporte mensal'), '250');
    expect(replace).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(null, '', expect.stringContaining('aporte=250'));

    replace.mockClear();
    await user.clear(screen.getByLabelText('Aporte mensal'));
    await user.type(screen.getByLabelText('Aporte mensal'), 'x');
    vi.advanceTimersByTime(500);
    expect(replace).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('url-state: URL é sempre ponto-decimal', () => {
  const base = { aporte: 0, ratePeriod: 'month' as const, months: 12 };

  it.each([
    ['taxa 1.234', { ...base, initial: 1000, rate: 0.01234 }, 'taxa', '1.234', '1,234'],
    ['taxa 0.123', { ...base, initial: 1000, rate: 0.00123 }, 'taxa', '0.123', '0,123'],
    ['capital 1000.5', { ...base, initial: 1000.5, rate: 0.01 }, 'capital', '1000.5', '1000,5'],
  ])('ida e volta: %s', (_n, inp, key, param, shown) => {
    const input: CompoundInterestInput = {
      initial: inp.initial,
      monthlyContribution: inp.aporte,
      rate: inp.rate,
      ratePeriod: inp.ratePeriod,
      months: inp.months,
    };
    const sp = toSearchParams(input);
    expect(sp.get(key)).toBe(param);
    const back = fromSearchParams(sp);
    expect(back.values[key as 'taxa' | 'capital']).toBe(shown);
    expect(back.input).toEqual(input);
  });

  it('"1.000" na URL significa 1, não mil', () => {
    const { values, input } = fromSearchParams(new URLSearchParams('capital=1.000'));
    expect(values.capital).toBe('1');
    expect(input?.initial).toBe(1);
  });

  it('nunca emite notação exponencial', () => {
    const sp = toSearchParams({
      initial: 0.0000001,
      monthlyContribution: 0,
      rate: 1e-9,
      ratePeriod: 'month',
      months: 12,
    });
    for (const k of ['capital', 'aporte', 'taxa', 'prazo'])
      expect(sp.get(k)).toMatch(/^-?\d+(\.\d+)?$/);
    expect(sp.get('capital')).toBe('0.0000001');
    expect(sp.get('taxa')).toBe('0.0000001');
  });

  it('texto não numérico na URL é mantido para o campo acusar erro', () => {
    expect(fromSearchParams(new URLSearchParams('taxa=1e3')).values.taxa).toBe('1e3');
  });
});

describe('CompoundInterestForm: montagem', () => {
  it('não navega na montagem com URL inalterada', () => {
    vi.useFakeTimers();
    render(<CompoundInterestForm initial={DEFAULT_VALUES} />);
    vi.advanceTimersByTime(1000);
    expect(replace).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('inflação (premissa)', () => {
  const NOTE = 'Padrão: IPCA 12 meses de 4,58% (ref. 09/2026); premissa, não previsão.';

  it('com inflação de 10%, mostra o valor final em reais de hoje e a taxa real anual', () => {
    render(
      <CompoundInterestForm initial={{ ...DEFAULT_VALUES, inflacao: '10' }} inflationNote={NOTE} />,
    );
    // 2.395,08 ÷ 1,1 (12 meses = 1 ano)
    expect(screen.getByTestId('final-real')).toHaveTextContent('2.177,34');
    expect(screen.getByText('Valor final em reais de hoje')).toBeInTheDocument();
    // (1,01^12 − 1) = 12,68% nominal; real = 1,126825/1,1 − 1 = 2,44%
    expect(screen.getByTestId('real-rate')).toHaveTextContent('+2,44% a.a.');
    expect(screen.getByTestId('real-rate')).toHaveTextContent('a.m.');
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Em reais de hoje' })).toBeInTheDocument();
  });

  it('inflação vazia: a seção real não é renderizada', () => {
    render(<CompoundInterestForm initial={DEFAULT_VALUES} />);
    expect(screen.queryByTestId('final-real')).toBeNull();
    expect(screen.queryByTestId('real-rate')).toBeNull();
    expect(screen.queryByRole('columnheader', { name: 'Em reais de hoje' })).toBeNull();
    expect(screen.getByTestId('final-balance')).toBeInTheDocument();
  });

  it('inflação inválida ou fora do limite: erro no campo, sem NaN e sem seção real', () => {
    const { unmount } = render(
      <CompoundInterestForm initial={{ ...DEFAULT_VALUES, inflacao: 'abc' }} />,
    );
    expect(screen.getByLabelText('Inflação anual esperada (premissa)')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByText('Informe um número válido')).toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity|undefined/)).toBeNull();
    expect(screen.queryByTestId('final-real')).toBeNull();
    unmount();

    render(<CompoundInterestForm initial={{ ...DEFAULT_VALUES, inflacao: '150' }} />);
    expect(screen.getByText('Informe uma inflação entre -50% e 100% a.a.')).toBeInTheDocument();
    expect(screen.queryByTestId('final-real')).toBeNull();
  });

  it('sem padrão do IPCA: campo vazio e nota de indisponibilidade', () => {
    render(<CompoundInterestForm initial={DEFAULT_VALUES} />);
    expect(screen.getByLabelText('Inflação anual esperada (premissa)')).toHaveValue('');
    expect(
      screen.getByText(
        'IPCA indisponível no momento; informe uma premissa se quiser ver o valor em reais de hoje',
      ),
    ).toBeInTheDocument();
  });
});

describe('URL e a inflação padrão', () => {
  const urlWith = async (type: string | null, initialInflacao: string) => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(
      <CompoundInterestForm
        initial={{ ...DEFAULT_VALUES, inflacao: initialInflacao }}
        defaultInflation="4,58"
      />,
    );
    const q = within(container);
    await user.clear(q.getByLabelText('Aporte mensal'));
    await user.type(q.getByLabelText('Aporte mensal'), '250');
    if (type !== null) {
      await user.clear(q.getByLabelText('Inflação anual esperada (premissa)'));
      if (type !== '')
        await user.type(q.getByLabelText('Inflação anual esperada (premissa)'), type);
    }
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    return String(replace.mock.calls.at(-1)?.[2]);
  };

  it('valor igual ao padrão: não grava inflacao', async () => {
    expect(await urlWith(null, '4,58')).not.toContain('inflacao');
    replace.mockClear();
    expect(await urlWith('4,58', '4,58')).not.toContain('inflacao');
  });

  it('valor diferente do padrão grava inflacao', async () => {
    expect(await urlWith('6,5', '4,58')).toContain('inflacao=6.5');
  });

  it('campo vazio com padrão disponível grava inflacao= (desligado)', async () => {
    expect(await urlWith('', '4,58')).toMatch(/inflacao=(&|$)/);
  });

  it('campo vazio sem padrão não grava', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<CompoundInterestForm initial={DEFAULT_VALUES} />);
    await user.clear(within(container).getByLabelText('Aporte mensal'));
    await user.type(within(container).getByLabelText('Aporte mensal'), '250');
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    expect(String(replace.mock.calls.at(-1)?.[2])).not.toContain('inflacao');
  });
});

describe('url-state: inflação', () => {
  it('ausente usa o padrão; vazio desliga; valor é lido com ponto decimal', () => {
    const none = fromSearchParams(new URLSearchParams(), '4,58');
    expect(none.values.inflacao).toBe('4,58');
    expect(validateValues(none.values).inflation).toBeCloseTo(0.0458);

    const off = fromSearchParams(new URLSearchParams('inflacao='), '4,58');
    expect(off.values.inflacao).toBe('');
    expect(validateValues(off.values).inflation).toBeNull();

    const set = fromSearchParams(new URLSearchParams('inflacao=6.5'), '4,58');
    expect(set.values.inflacao).toBe('6,5');
  });

  it('valida limites e escreve o parâmetro na URL', () => {
    const bad = validateValues({ ...DEFAULT_VALUES, inflacao: '101' });
    expect(bad.inflation).toBeNull();
    expect(bad.inflationError).toBe('Informe uma inflação entre -50% e 100% a.a.');
    expect(bad.input).toBeDefined();
    expect(validateValues({ ...DEFAULT_VALUES, inflacao: '-50' }).inflation).toBeCloseTo(-0.5);

    const input = validateValues(DEFAULT_VALUES).input!;
    expect(toSearchParams(input, 'meses', 0.0458).get('inflacao')).toBe('4.58');
    expect(toSearchParams(input, 'meses', null).get('inflacao')).toBe('');
    expect(toSearchParams(input, 'meses').has('inflacao')).toBe(false);
  });
});
