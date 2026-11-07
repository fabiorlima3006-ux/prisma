import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompoundInterestInput } from '@/lib/finance/compound-interest';
import { CompoundInterestForm } from './CompoundInterestForm';
import { DEFAULT_VALUES, fromSearchParams, toSearchParams } from './url-state';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

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

  it('entrada inválida dá input nulo; sem parâmetros usa os padrões', () => {
    expect(fromSearchParams(new URLSearchParams('capital=abc')).input).toBeNull();
    const d = fromSearchParams(new URLSearchParams());
    expect(d.values).toEqual(DEFAULT_VALUES);
    expect(d.input).not.toBeNull();
  });
});

describe('CompoundInterestForm', () => {
  it('calcula, mostra erro por campo e nunca exibe NaN', async () => {
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

    await user.clear(screen.getByLabelText('Prazo'));
    await user.type(screen.getByLabelText('Prazo'), 'abc');
    expect(screen.getByLabelText('Prazo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Informe um número válido')).toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).toBeNull();
    expect(screen.queryByTestId('final-balance')).toBeNull();
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
    expect(replace).toHaveBeenCalledWith(expect.stringContaining('aporte=250'), { scroll: false });

    replace.mockClear();
    await user.clear(screen.getByLabelText('Aporte mensal'));
    await user.type(screen.getByLabelText('Aporte mensal'), 'x');
    vi.advanceTimersByTime(500);
    expect(replace).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
