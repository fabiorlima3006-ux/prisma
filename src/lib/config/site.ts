/** URL base sem barra final (evita "//" ao concatenar caminhos no canonical, sitemap e OG). */
export function normalizeSiteUrl(raw: string | undefined): string {
  const url = raw?.trim() || 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

/**
 * URL pública: NEXT_PUBLIC_SITE_URL, se definida; senão o domínio de produção que a Vercel
 * injeta no build (VERCEL_PROJECT_PRODUCTION_URL, sem protocolo); senão localhost.
 */
export function resolveSiteUrl(env: {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
}): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return normalizeSiteUrl(explicit);
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return normalizeSiteUrl(vercel ? `https://${vercel}` : undefined);
}

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
  url: resolveSiteUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  }),
  links: { github: 'https://github.com/fabiorlima3006-ux' },
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
