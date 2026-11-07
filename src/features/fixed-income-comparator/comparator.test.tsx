import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DataResult, IndicatorValue } from '@/lib/data/types';
import { TAX_RULES } from '@/lib/config/tax-rules';
import { ComparatorForm } from './ComparatorForm';

// O gráfico tem testes próprios; sua tabela sr-only duplicaria as linhas da tabela principal.
vi.mock('@/components/charts', () => ({
  BarChart: ({ data, title }: { data: { label: string }[]; title: string }) => (
    <div data-testid="bar-chart" aria-label={title}>
      {data.map((d) => d.label).join('|')}
    </div>
  ),
}));

const unavailable: DataResult<IndicatorValue> = {
  status: 'unavailable',
  reason: 'fetch-failed',
  source: 'bcb',
  attribution: 'Banco Central do Brasil',
};

function ok(id: IndicatorValue['id'], value: number, unit: IndicatorValue['unit']): DataResult<IndicatorValue> {
  return {
    status: 'ok',
    data: { id, value, unit, referenceDate: '2026-11-06' },
    meta: { source: 'bcb', isDemo: false, asOf: '2026-11-06T12:00:00Z', attribution: 'Banco Central do Brasil' },
  };
}

describe('ComparatorForm', () => {
  it('modo manual quando taxas indisponíveis: calcula, destaca e valida prazo', async () => {
    const user = userEvent.setup();
    render(
      <ComparatorForm rates={{ cdi: unavailable, selic: unavailable, tr: unavailable }} rules={TAX_RULES} />,
    );
    expect(screen.getByText('Taxas informadas pelo usuário')).toBeInTheDocument();
    expect(screen.getByText('TR indisponível; considerada 0')).toBeInTheDocument();
    await user.type(screen.getByLabelText('CDI (% a.a.)'), '10');
    await user.type(screen.getByLabelText('Selic meta (% a.a.)'), '10,5');
    await user.clear(screen.getByLabelText('Valor'));
    await user.type(screen.getByLabelText('Valor'), '10.000');
    await user.clear(screen.getByLabelText('Prazo (dias)'));
    await user.type(screen.getByLabelText('Prazo (dias)'), '365');
    const row = await screen.findByRole('row', { name: /CDB/ });
    expect(row).toHaveTextContent('10.825,00');
    expect(screen.getByText('maior valor líquido nesta simulação')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/melhor investimento/i);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText(/Regras tributárias vigentes em 07\/11\/2026/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Prazo (dias)'));
    await user.type(screen.getByLabelText('Prazo (dias)'), '29');
    expect(screen.getByLabelText('Prazo (dias)')).toHaveAttribute('aria-invalid', 'true');
  });

  it('campos manuais vazios geram erro e nenhum resultado', () => {
    render(
      <ComparatorForm rates={{ cdi: unavailable, selic: unavailable, tr: unavailable }} rules={TAX_RULES} />,
    );
    expect(screen.getByLabelText('CDI (% a.a.)')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('table', { name: 'Comparação de renda fixa' })).not.toBeInTheDocument();
  });

  it('com taxas reais mostra valores somente leitura e permite alternar para manual', async () => {
    const user = userEvent.setup();
    render(
      <ComparatorForm
        rates={{ cdi: ok('cdi', 0.1065, 'a.a.'), selic: ok('selic', 0.105, 'a.a.'), tr: ok('tr', 0, 'a.m.') }}
        rules={TAX_RULES}
      />,
    );
    expect(screen.queryByLabelText('CDI (% a.a.)')).not.toBeInTheDocument();
    expect(screen.getByText(/10,65%/)).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Comparação de renda fixa' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Informar taxas manualmente' }));
    expect(screen.getByLabelText('CDI (% a.a.)')).toHaveValue('10,65');
    expect(screen.getByText('Taxas informadas pelo usuário')).toBeInTheDocument();
  });

  it('linha indisponível mostra o motivo (LCI com prazo curto)', async () => {
    const user = userEvent.setup();
    render(
      <ComparatorForm
        rates={{ cdi: ok('cdi', 0.1, 'a.a.'), selic: ok('selic', 0.105, 'a.a.'), tr: ok('tr', 0, 'a.m.') }}
        rules={TAX_RULES}
      />,
    );
    await user.clear(screen.getByLabelText('Prazo (dias)'));
    await user.type(screen.getByLabelText('Prazo (dias)'), '90');
    const reason = await screen.findAllByText(/carência mínima de 180 dias/);
    expect(reason).toHaveLength(2);
    const row = screen.getByRole('row', { name: /LCI/ });
    expect(within(row).getByText(/carência mínima de 180 dias/)).toBeInTheDocument();
  });
});
