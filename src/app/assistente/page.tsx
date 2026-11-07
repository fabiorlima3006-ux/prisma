import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = { title: 'Assistente' };

export default function Page() {
  return (
    <ComingSoon
      title="Assistente"
      phase={3}
      description="Área para um assistente educacional que explica conceitos e indicadores."
      links={[
        { label: 'Educação', href: '/educacao' },
        { label: 'Ferramentas', href: '/ferramentas' },
      ]}
    />
  );
}
