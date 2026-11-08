import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { retirementPlan } from '@/lib/finance/retirement';
import { formatCurrency } from '@/lib/format';
import { RetirementForm } from './RetirementForm';
import {
  DEFAULT_VALUES,
  fromSearchParams,
  toSearchParams,
  validateValues,
  type FormValues,
} from './url-state';

function setup(initial: Partial<FormValues> = {}) {
  const { container } = render(<RetirementForm initial={{ ...DEFAULT_VALUES, ...initial }} />);
  return within(container);
}

describe('url-state', () => {
  it('padrões: 30 anos, sem alvo, R$ 10.000, R$ 1.000/mês, R$ 5.000 e 4%', () => {
    expect(DEFAULT_VALUES).toEqual({
      idade: '30',
      alvo: '',
      patrimonio: '10000',
      aporte: '1000',
      renda: '5000',
      real: '4',
    });
    const v = validateValues(DEFAULT_VALUES);
    expect(v.input).toEqual({
      currentAge: 30,
      targetAge: null,
      currentWealth: 10000,
      monthlyContribution: 1000,
      desiredMonthlyIncome: 5000,
      realAnnualReturn: 0.04,
    });
  });

  it('faz ida e volta com a URL', () => {
    const input = validateValues({ ...DEFAULT_VALUES, alvo: '60', real: '3,5' }).input!;
    const sp = toSearchParams(input);
    expect(sp.get('alvo')).toBe('60');
    expect(sp.get('real')).toBe('3.5');
    expect(fromSearchParams(sp).input).toEqual(input);
  });

  it('sem alvo não escreve o parâmetro; valor inválido vira erro no campo', () => {
    expect(toSearchParams(validateValues(DEFAULT_VALUES).input!).has('alvo')).toBe(false);
    const v = validateValues({ ...DEFAULT_VALUES, idade: 'abc', alvo: '20' });
    expect(v.errors?.idade).toBeTruthy();
    const w = validateValues({ ...DEFAULT_VALUES, alvo: '20' });
    expect(w.errors?.alvo).toContain('idade-alvo');
  });
});

describe('RetirementForm', () => {
  it('caso padrão mostra o patrimônio necessário e o tempo com a idade', () => {
    const ui = setup();
    const plan = retirementPlan(validateValues(DEFAULT_VALUES).input!);
    expect(ui.getByTestId('required-wealth')).toHaveTextContent(
      formatCurrency(plan.requiredWealth!).replace(/\s/g, ' '),
    );
    expect(ui.getByText('Patrimônio necessário')).toBeInTheDocument();
    const t = ui.getByTestId('time-to-target').textContent ?? '';
    expect(t).toMatch(/\d+ anos? e \d+ m(ês|eses)/);
    expect(t).toContain(`${plan.ageAtTarget!.years} anos`);
    expect(ui.queryByText(/NaN|Infinity|undefined/)).toBeNull();
  });

  it('rentabilidade real zero explica que não dá para viver só dos rendimentos', () => {
    const ui = setup({ real: '0' });
    expect(
      ui.getByText('Com rentabilidade real zero, não é possível viver só dos rendimentos'),
    ).toBeInTheDocument();
  });

  it('meta não atingida mostra a mensagem de 100 anos', () => {
    const ui = setup({ aporte: '0', patrimonio: '0', renda: '100000', real: '1' });
    expect(
      ui.getByText('Com esses valores, o patrimônio necessário não é atingido em 100 anos'),
    ).toBeInTheDocument();
  });

  it('idade acima de 100 mostra a mensagem em vez da idade', () => {
    const values = { idade: '18', aporte: '120', patrimonio: '0', renda: '3000', real: '4' };
    const plan = retirementPlan(validateValues({ ...DEFAULT_VALUES, ...values }).input!);
    expect(plan.ageAtTarget!.years).toBeGreaterThan(100);
    const ui = setup(values);
    expect(
      ui.getByText(
        'Com esses valores, o patrimônio necessário só seria atingido depois dos 100 anos de idade',
      ),
    ).toBeInTheDocument();
  });

  it('com alvo 60 aparece o aporte mensal necessário', async () => {
    const user = userEvent.setup();
    const ui = setup();
    expect(ui.queryByText('Aporte mensal necessário')).toBeNull();
    await user.type(ui.getByLabelText('Idade-alvo (opcional)'), '60');
    expect(ui.getByText('Aporte mensal necessário')).toBeInTheDocument();
    const needed = retirementPlan(validateValues({ ...DEFAULT_VALUES, alvo: '60' }).input!)
      .contributionForTargetAge as number;
    expect(ui.getByTestId('needed-contribution')).toHaveTextContent(
      formatCurrency(needed).replace(/\s/g, ' '),
    );
  });

  it('patrimônio suficiente mostra que já cobre a renda', () => {
    const ui = setup({ alvo: '60', patrimonio: '5000000' });
    expect(
      ui.getByText('O patrimônio atual já cobre a renda desejada nesta simulação'),
    ).toBeInTheDocument();
  });

  it('mostra o aviso de simplificação e a premissa', () => {
    const ui = setup();
    expect(
      ui.getByText(
        'Valores em reais de hoje. Rentabilidade real constante é uma simplificação; IR e custos não estão incluídos; resultados reais variam.',
      ),
    ).toBeInTheDocument();
    expect(
      ui.getByText(
        'Valor ilustrativo, não é dado de mercado nem previsão: o retorno real futuro é incerto.',
      ),
    ).toBeInTheDocument();
    expect(ui.getByText(/premissa/i)).toBeInTheDocument();
  });

  it('a tabela acessível do gráfico cita o patrimônio necessário', () => {
    const ui = setup();
    const plan = retirementPlan(validateValues(DEFAULT_VALUES).input!);
    const caption = ui
      .getAllByRole('table', { hidden: true })
      .map((t) => t.querySelector('caption')?.textContent ?? '')
      .join(' ')
      .replace(/\s/g, ' ');
    expect(caption).toContain('patrimônio necessário');
    expect(caption).toContain(formatCurrency(plan.requiredWealth!).replace(/\s/g, ' '));
  });

  it('campo inválido mostra erro e esconde o resultado', async () => {
    const user = userEvent.setup();
    const ui = setup();
    const renda = ui.getByLabelText('Renda mensal desejada');
    await user.clear(renda);
    await user.type(renda, '0');
    expect(ui.queryByTestId('required-wealth')).toBeNull();
    expect(ui.getByText(/maior que zero/)).toBeInTheDocument();
  });
});
