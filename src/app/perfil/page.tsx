import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Meu perfil',
  description: 'Área em construção para preferências e perfil de investidor.',
  path: '/perfil',
});

export default function Page() {
  return (
    <ComingSoon
      title="Meu perfil"
      phase={2}
      description="Área para preferências pessoais e para o questionário de perfil de investidor."
      links={[
        { label: 'Educação', href: '/educacao' },
        { label: 'Simuladores', href: '/simuladores' },
      ]}
    />
  );
}
