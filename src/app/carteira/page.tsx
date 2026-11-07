import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = { title: 'Carteira' };

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
