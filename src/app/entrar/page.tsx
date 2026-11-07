import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = { title: 'Entrar' };

export default function Page() {
  return (
    <ComingSoon
      title="Entrar"
      phase={2}
      description="Área de acesso à conta. Por enquanto, a plataforma funciona sem cadastro."
      links={[
        { label: 'Mercados', href: '/mercados' },
        { label: 'Ferramentas', href: '/ferramentas' },
      ]}
    />
  );
}
