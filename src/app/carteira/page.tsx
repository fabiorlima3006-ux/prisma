import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Carteira',
  description: 'Área em construção para acompanhar uma carteira de investimentos.',
  path: '/carteira',
});

export default function Page() {
  return (
    <ComingSoon
      title="Carteira"
      phase={2}
      description="Área para acompanhar uma carteira de ativos e a distribuição entre classes."
      links={[
        { label: 'Mercados', href: '/mercados' },
        { label: 'Simuladores', href: '/simuladores' },
        { label: 'Educação', href: '/educacao' },
      ]}
    />
  );
}
