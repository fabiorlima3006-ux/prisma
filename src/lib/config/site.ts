export type NavItem = { label: string; href: string; children?: NavItem[] };

export const siteConfig: {
  name: 'Prisma';
  description: string;
  url: string;
  links: { github: string };
  nav: NavItem[];
  userNav: NavItem[];
} = {
  name: 'Prisma',
  description:
    'Plataforma para acompanhar mercados, estudar investimentos, analisar ativos e simular cenários.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  links: { github: 'https://github.com/' },
  nav: [
    { label: 'Mercados', href: '/mercados' },
    {
      label: 'Investimentos',
      href: '/investimentos',
      children: [
        { label: 'Ações', href: '/acoes' },
        { label: 'FIIs', href: '/fiis' },
        { label: 'ETFs', href: '/etfs' },
        { label: 'Fundos', href: '/fundos' },
        { label: 'Renda fixa', href: '/renda-fixa' },
        { label: 'Cripto', href: '/cripto' },
      ],
    },
    { label: 'Opções', href: '/opcoes' },
    { label: 'Simuladores', href: '/simuladores' },
    { label: 'Ferramentas', href: '/ferramentas' },
    { label: 'Educação', href: '/educacao' },
    { label: 'Notícias', href: '/noticias' },
  ],
  userNav: [
    { label: 'Carteira', href: '/carteira' },
    { label: 'Análises', href: '/analises' },
    { label: 'Assistente', href: '/assistente' },
    { label: 'Meu Perfil', href: '/perfil' },
  ],
};
