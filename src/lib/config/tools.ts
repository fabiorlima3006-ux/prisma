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
    id: 'aposentadoria',
    title: 'Simulador de aposentadoria',
    description: 'Estime quanto acumular para manter a renda desejada no futuro.',
    href: '/simuladores',
    status: 'planned',
    phase: 2,
    keywords: ['aposentadoria', 'previdência', 'longo prazo'],
  },
  {
    id: 'independencia-financeira',
    title: 'Independência financeira',
    description: 'Calcule o patrimônio necessário para viver de rendimentos.',
    href: '/simuladores',
    status: 'planned',
    phase: 2,
    keywords: ['independência', 'fire', 'patrimônio'],
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
    href: '/simuladores',
    status: 'planned',
    phase: 2,
    keywords: ['inflação', 'ipca', 'poder de compra'],
  },
  {
    id: 'financiamento',
    title: 'Simulador de financiamento',
    description: 'Simule parcelas, juros totais e o custo de um financiamento.',
    href: '/simuladores',
    status: 'planned',
    phase: 2,
    keywords: ['financiamento', 'parcelas', 'juros'],
  },
  {
    id: 'amortizacao',
    title: 'Simulador de amortização',
    description: 'Compare os sistemas SAC e Price e o efeito de amortizações extras.',
    href: '/simuladores',
    status: 'planned',
    phase: 2,
    keywords: ['amortização', 'sac', 'price'],
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
