export type ChartPoint = { label: string; value: number };

export type ChartProps = {
  data: ChartPoint[];
  /** Nome acessível do gráfico (também legenda da tabela equivalente). */
  title: string;
  description?: string;
  /** Formata valores no eixo, na dica e na tabela. */
  formatValue?: (v: number) => string;
};
