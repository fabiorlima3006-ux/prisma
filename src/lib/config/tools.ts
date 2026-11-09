export type Tool = {
  id: string;
  title: string;
  description: string;
  href: string;
  status: 'available' | 'planned';
  phase: 1 | 2 | 3;
  keywords: string[];
};

export const TOOLS: readonly Tool[] = [
  {
    id: 'juros-compostos',
    title: 'Simulador de juros compostos',
    description: 'Veja como aportes mensais e o tempo fazem o patrimônio evoluir.',
    href: '/simuladores/juros-compostos',
    status: 'available',
    phase: 1,
    keywords: ['juros', 'compostos', 'aportes', 'patrimônio', 'simulador'],
  },
  {
    id: 'comparador',
    title: 'Comparador de investimentos',
    description: 'Compare alternativas de renda fixa considerando prazo e imposto.',
    href: '/ferramentas/comparador',
    status: 'available',
    phase: 1,
    keywords: ['comparar', 'cdb', 'lci', 'lca', 'tesouro', 'poupança'],
  },
  {
    id: 'independencia-financeira',
    title: 'Aposentadoria e independência financeira',
    description: 'Estime o patrimônio para viver de rendimentos e em quanto tempo chegar lá.',
    href: '/simuladores/independencia-financeira',
    status: 'available',
    phase: 2,
    keywords: [
      'aposentadoria',
      'previdência',
      'longo prazo',
      'independência',
      'fire',
      'patrimônio',
    ],
  },
  {
    id: 'renda-passiva',
    title: 'Renda passiva',
    description: 'Simule a renda mensal gerada por uma carteira de proventos.',
    href: '/simuladores',
    status: 'planned',
    phase: 2,
    keywords: ['renda', 'passiva', 'proventos'],
  },
  {
    id: 'inflacao',
    title: 'Simulador de inflação',
    description: 'Entenda o efeito da inflação sobre o poder de compra ao longo do tempo.',
    href: '/simuladores/inflacao',
    status: 'available',
    phase: 2,
    keywords: ['inflação', 'ipca', 'poder de compra'],
  },
  {
    id: 'financiamento',
    title: 'Financiamento: SAC e Price',
    description: 'Compare parcelas e juros totais nos sistemas SAC e Price, com amortização extra.',
    href: '/simuladores/financiamento',
    status: 'available',
    phase: 2,
    keywords: ['financiamento', 'parcelas', 'juros', 'amortização', 'sac', 'price'],
  },
  {
    id: 'dividendos',
    title: 'Simulador de dividendos',
    description: 'Projete proventos recebidos e reinvestidos ao longo dos anos.',
    href: '/simuladores',
    status: 'planned',
    phase: 2,
    keywords: ['dividendos', 'proventos', 'reinvestimento'],
  },
  {
    id: 'opcoes',
    title: 'Simulador de opções',
    description: 'Visualize o payoff de estratégias com opções e seus limites de ganho e perda.',
    href: '/opcoes',
    status: 'planned',
    phase: 3,
    keywords: ['opções', 'payoff', 'travas', 'derivativos'],
  },
];
