import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DataResult, IndicatorValue } from '@/lib/data/types';
import { TAX_RULES } from '@/lib/config/tax-rules';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { compareFixedIncome } from '@/lib/finance/fixed-income';
import { ComparatorChart } from './ComparatorChart';
import { ComparatorForm } from './ComparatorForm';

// O gráfico tem testes próprios; sua tabela sr-only duplicaria as linhas da tabela principal.
vi.mock('@/components/charts', () => ({
  BarChart: ({
    data,
    title,
    labelHeader,
  }: {
    data: { label: string }[];
    title: string;
    labelHeader?: string;
  }) => (
    <div data-testid="bar-chart" aria-label={title} data-label-header={labelHeader}>
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

function ok(
  id: IndicatorValue['id'],
  value: number,
  unit: IndicatorValue['unit'],
): DataResult<IndicatorValue> {
  return {
    status: 'ok',
    data: { id, value, unit, referenceDate: '2026-11-06' },
    meta: {
      source: 'bcb',
      isDemo: false,
      asOf: '2026-11-06T12:00:00Z',
      attribution: 'Banco Central do Brasil',
    },
  };
}

describe('ChartFrame', () => {
  it('usa Data por padrão e o labelHeader quando informado', () => {
    const data = [{ label: 'CDB', value: 1 }];
    const { unmount } = render(
      <ChartFrame data={data} title="g1">
        {null}
      </ChartFrame>,
    );
    expect(screen.getByRole('columnheader', { name: 'Data' })).toBeInTheDocument();
    unmount();
    render(
      <ChartFrame data={data} title="g2" labelHeader="Produto">
        {null}
      </ChartFrame>,
    );
    expect(screen.getByRole('columnheader', { name: 'Produto' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Data' })).not.toBeInTheDocument();
  });
});

describe('ComparatorChart', () => {
  it('passa labelHeader Produto e legenda própria ao gráfico', () => {
    const rows = compareFixedIncome(
      {
        amount: 10000,
        calendarDays: 365,
        cdbPctCdi: 1,
        lciLcaPctCdi: 0.9,
        rates: { cdiAnnual: 0.1, selicAnnual: 0.105, trMonthly: 0 },
      },
      TAX_RULES,
    );
    render(<ComparatorChart rows={rows} />);
    const chart = screen.getByTestId('bar-chart');
    expect(chart).toHaveAttribute('data-label-header', 'Produto');
    expect(chart).toHaveAttribute(
      'aria-label',
      'Gráfico: valor líquido ao final do prazo, por produto',
    );
  });
});

describe('ComparatorForm', () => {
  it('modo manual quando taxas indisponíveis: calcula, destaca e valida prazo', async () => {
    const user = userEvent.setup();
    render(
      <ComparatorForm
        rates={{ cdi: unavailable, selic: unavailable, tr: unavailable }}
        rules={TAX_RULES}
        inflation={null}
      />,
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

  describe('inflação', () => {
    const manualRates = { cdi: unavailable, selic: unavailable, tr: unavailable };

    async function setup(inflation: { percent: string; note: string } | null) {
      const user = userEvent.setup();
      const { container } = render(
        <ComparatorForm rates={manualRates} rules={TAX_RULES} inflation={inflation} />,
      );
      const q = within(container);
      await user.type(q.getByLabelText('CDI (% a.a.)'), '10');
      await user.type(q.getByLabelText('Selic meta (% a.a.)'), '10,5');
      return { user, q };
    }

    it('com inflação de 5%, mostra o líquido em reais de hoje e o retorno real', async () => {
      const { user, q } = await setup({ percent: '', note: 'nota' });
      await user.type(q.getByLabelText('Inflação estimada (% a.a.)'), '5');
      const row = await q.findByRole('row', { name: /CDB/ });
      expect(q.getByRole('columnheader', { name: 'Líquido em reais de hoje' })).toBeInTheDocument();
      expect(q.getByRole('columnheader', { name: 'Retorno real anualizado' })).toBeInTheDocument();
      // 10.825,00 / 1,05 = 10.309,52; (1,0825 / 1,05) - 1 = 3,10%
      await waitFor(() => expect(row).toHaveTextContent('10.309,52'));
      expect(row).toHaveTextContent('3,10%');
      expect(document.body.textContent).not.toMatch(/NaN|Infinity|undefined/);
    });

    it('usa o padrão e a nota recebidos, com rótulo de premissa', async () => {
      const { q } = await setup({
        percent: '4,58',
        note: 'IPCA 12 meses (premissa, não previsão)',
      });
      expect(q.getByLabelText('Inflação estimada (% a.a.)')).toHaveValue('4,58');
      expect(q.getByText(/premissa, não previsão/)).toBeInTheDocument();
      expect(
        await q.findByRole('columnheader', { name: 'Líquido em reais de hoje' }),
      ).toBeInTheDocument();
    });

    it('com inflação vazia, as colunas novas não existem', async () => {
      const { q } = await setup(null);
      await q.findByRole('row', { name: /CDB/ });
      expect(q.getByLabelText('Inflação estimada (% a.a.)')).toHaveValue('');
      expect(
        q.queryByRole('columnheader', { name: 'Líquido em reais de hoje' }),
      ).not.toBeInTheDocument();
      expect(
        q.queryByRole('columnheader', { name: 'Retorno real anualizado' }),
      ).not.toBeInTheDocument();
      expect(q.getByText(/IPCA indisponível no momento/)).toBeInTheDocument();
    });

    it('com inflação inválida, há erro de campo e as colunas novas somem', async () => {
      const { user, q } = await setup(null);
      await user.type(q.getByLabelText('Inflação estimada (% a.a.)'), '150');
      expect(q.getByLabelText('Inflação estimada (% a.a.)')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(q.getByText('Informe uma inflação entre -50% e 100% a.a.')).toBeInTheDocument();
      await q.findByRole('row', { name: /CDB/ });
      expect(
        q.queryByRole('columnheader', { name: 'Líquido em reais de hoje' }),
      ).not.toBeInTheDocument();
    });
  });

  it('campos manuais vazios geram erro e nenhum resultado', () => {
    render(
      <ComparatorForm
        rates={{ cdi: unavailable, selic: unavailable, tr: unavailable }}
        rules={TAX_RULES}
        inflation={null}
      />,
    );
    expect(screen.getByLabelText('CDI (% a.a.)')).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.queryByRole('table', { name: 'Comparação de renda fixa' }),
    ).not.toBeInTheDocument();
  });

  it('com taxas reais mostra valores somente leitura e permite alternar para manual', async () => {
    const user = userEvent.setup();
    render(
      <ComparatorForm
        rates={{
          cdi: ok('cdi', 0.1065, 'a.a.'),
          selic: ok('selic', 0.105, 'a.a.'),
          tr: ok('tr', 0, 'a.m.'),
        }}
        rules={TAX_RULES}
        inflation={null}
      />,
    );
    expect(screen.queryByLabelText('CDI (% a.a.)')).not.toBeInTheDocument();
    expect(screen.getByText(/10,65%/)).toBeInTheDocument();
    expect(screen.getAllByText('ref. 06/11/2026')).toHaveLength(3);
    expect(screen.getAllByText(/consultado em 06\/11\/2026 09:00/)).toHaveLength(3);
    expect(
      await screen.findByRole('table', { name: 'Comparação de renda fixa' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Informar taxas manualmente' }));
    expect(screen.getByLabelText('CDI (% a.a.)')).toHaveValue('10,65');
    expect(screen.getByText('Taxas informadas pelo usuário')).toBeInTheDocument();
  });

  it('linha indisponível mostra o motivo (LCI com prazo curto)', async () => {
    const user = userEvent.setup();
    render(
      <ComparatorForm
        rates={{
          cdi: ok('cdi', 0.1, 'a.a.'),
          selic: ok('selic', 0.105, 'a.a.'),
          tr: ok('tr', 0, 'a.m.'),
        }}
        rules={TAX_RULES}
        inflation={null}
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
