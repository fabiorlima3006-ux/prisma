export const LEVELS = ['iniciante', 'intermediario', 'avancado'] as const;

export type TrackSlug = (typeof LEVELS)[number];

export type Track = {
  slug: TrackSlug;
  title: string;
  description: string;
  articles: string[];
};

export const TRACKS: Track[] = [
  {
    slug: 'iniciante',
    title: 'Começando a investir',
    description:
      'Juros compostos, inflação, risco, liquidez e os primeiros produtos de renda fixa.',
    articles: ['juros-compostos-e-inflacao', 'risco-retorno-e-liquidez', 'renda-fixa-basica'],
  },
  {
    slug: 'intermediario',
    title: 'Analisando ativos',
    description:
      'Indicadores fundamentalistas, fundos imobiliários e ETFs, com foco em diversificação.',
    articles: ['indicadores-fundamentalistas', 'fiis', 'etfs-e-diversificacao'],
  },
  {
    slug: 'avancado',
    title: 'Derivativos e gestão de risco',
    description:
      'Opções, volatilidade, gregas e princípios de gestão de risco, com o risco antes do ganho.',
    articles: ['introducao-a-opcoes', 'volatilidade-e-gregas', 'gestao-de-risco'],
  },
];
