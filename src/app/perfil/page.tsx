import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = { title: 'Meu perfil' };

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
