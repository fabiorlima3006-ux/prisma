// TODO(Tarefa 16): substituir por TRACKS exportado de src/features/education
// e usar TRACKS.length e os dados reais das trilhas.
export const TRACKS_COUNT = 3;

export const TRACK_CARDS: readonly {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  levelLabel: string;
}[] = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros passos nos investimentos',
    description: 'Juros, inflação, risco e liquidez explicados do zero.',
    level: 'beginner',
    levelLabel: 'Iniciante',
  },
  {
    id: 'renda-fixa-e-variavel',
    title: 'Renda fixa e renda variável',
    description: 'Como funcionam títulos, ações, FIIs e ETFs, e como compará-los.',
    level: 'intermediate',
    levelLabel: 'Intermediário',
  },
  {
    id: 'opcoes-do-zero',
    title: 'Opções do zero',
    description: 'Call, put, prêmio e travas, com foco em risco e payoff.',
    level: 'advanced',
    levelLabel: 'Avançado',
  },
];
