import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChartFrame } from './ChartFrame';
import { StackedAreaChart } from './StackedAreaChart';

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;

function stubIntersectionObserver() {
  const observers: { cb: IOCallback; options: IntersectionObserverInit | undefined }[] = [];
  class FakeIO {
    constructor(cb: IOCallback, options?: IntersectionObserverInit) {
      observers.push({ cb, options });
    }
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', FakeIO);
  return observers;
}

afterEach(() => vi.unstubAllGlobals());

describe('ChartFrame: gráfico só perto da viewport', () => {
  it('fora da tela: skeleton no lugar do gráfico, tabela sr-only sempre presente', () => {
    const observers = stubIntersectionObserver();
    const data = [{ label: '01/10/2026', value: 10 }];
    render(
      <ChartFrame data={data} title="Histórico">
        <div data-testid="grafico" />
      </ChartFrame>,
    );
    expect(screen.queryByTestId('grafico')).toBeNull();
    expect(screen.getByRole('table', { name: 'Histórico' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '01/10/2026' })).toBeInTheDocument();
    expect(observers[0]?.options?.rootMargin).toBe('200px');

    act(() => observers[0]?.cb([{ isIntersecting: true }]));
    expect(screen.getByTestId('grafico')).toBeInTheDocument();
  });

  it('StackedAreaChart usa a mesma moldura, com tabela de três colunas e legenda', () => {
    stubIntersectionObserver();
    render(
      <StackedAreaChart
        title="Evolução"
        data={[{ label: 'Ano 1', invested: 100, interest: 5 }]}
        formatValue={(v) => `R$ ${v}`}
      />,
    );
    expect(screen.getByRole('figure', { name: 'Evolução' })).toBeInTheDocument();
    for (const h of ['Período', 'Total investido', 'Juros acumulados']) {
      expect(screen.getByRole('columnheader', { name: h })).toBeInTheDocument();
    }
    expect(screen.getByRole('cell', { name: 'R$ 5' })).toBeInTheDocument();
  });
});
