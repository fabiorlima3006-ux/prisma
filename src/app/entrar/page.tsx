import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Entrar',
  description: 'Área de acesso, ainda em construção.',
  path: '/entrar',
  noindex: true,
});

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
