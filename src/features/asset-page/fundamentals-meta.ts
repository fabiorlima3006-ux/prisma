import type { Fundamentals } from '@/lib/data/types';

export type FundamentalMeta = {
  key: keyof Fundamentals;
  label: string;
  format: 'percent' | 'ratio';
  help: string;
  articleHref?: string;
};

const ARTICLE = '/educacao';

export const FUNDAMENTALS_META: FundamentalMeta[] = [
  {
    key: 'pl',
    label: 'P/L',
    format: 'ratio',
    help: 'Preço dividido pelo lucro por ação nos últimos 12 meses. Mostra quantos anos de lucro o preço representa; lucro cíclico ou pontual pode distorcer a leitura.',
    articleHref: ARTICLE,
  },
  {
    key: 'pvp',
    label: 'P/VP',
    format: 'ratio',
    help: 'Preço dividido pelo patrimônio líquido por ação. Compara o preço ao valor contábil; o valor contábil pode diferir do valor econômico dos ativos.',
    articleHref: ARTICLE,
  },
  {
    key: 'roe',
    label: 'ROE',
    format: 'percent',
    help: 'Lucro líquido dos últimos 12 meses sobre o patrimônio líquido médio. Mede o retorno gerado sobre o capital dos acionistas; endividamento elevado pode inflar o resultado.',
    articleHref: ARTICLE,
  },
  {
    key: 'roic',
    label: 'ROIC',
    format: 'percent',
    help: 'Resultado operacional após impostos sobre o capital investido (patrimônio mais dívida, menos caixa). Mede a eficiência do capital total; não se aplica da mesma forma a bancos.',
    articleHref: ARTICLE,
  },
  {
    key: 'netMargin',
    label: 'Margem líquida',
    format: 'percent',
    help: 'Parcela da receita que sobra como lucro líquido. Permite comparar a rentabilidade entre períodos; varia muito entre setores.',
    articleHref: ARTICLE,
  },
  {
    key: 'ebitdaMargin',
    label: 'Margem EBITDA',
    format: 'percent',
    help: 'Parcela da receita que sobra como resultado operacional antes de juros, impostos, depreciação e amortização. Ignora investimentos necessários para manter o negócio.',
    articleHref: ARTICLE,
  },
  {
    key: 'netDebtToEbitda',
    label: 'Dívida líquida/EBITDA',
    format: 'ratio',
    help: 'Dívida bruta menos caixa, dividida pelo EBITDA de 12 meses. Indica em quantos anos a geração operacional cobriria a dívida; não se aplica da mesma forma a bancos.',
    articleHref: ARTICLE,
  },
  {
    key: 'dividendYield',
    label: 'Dividend yield',
    format: 'percent',
    help: 'Dividendos e JCP brutos pagos nos últimos 12 meses divididos pelo preço atual. Descreve o passado e não garante pagamentos futuros.',
    articleHref: ARTICLE,
  },
  {
    key: 'payout',
    label: 'Payout',
    format: 'percent',
    help: 'Parcela do lucro distribuída como proventos. Valores muito altos podem limitar o reinvestimento no negócio; em FIIs, a regra de distribuição é diferente.',
    articleHref: ARTICLE,
  },
  {
    key: 'revenueCagr5y',
    label: 'CAGR receita 5a',
    format: 'percent',
    help: 'Taxa média anual composta de crescimento da receita em cinco anos. Suaviza oscilações do período e pode esconder anos muito diferentes entre si.',
    articleHref: ARTICLE,
  },
  {
    key: 'earningsCagr5y',
    label: 'CAGR lucro 5a',
    format: 'percent',
    help: 'Taxa média anual composta de crescimento do lucro em cinco anos. Só faz sentido com lucro positivo no início e no fim do período.',
    articleHref: ARTICLE,
  },
];
