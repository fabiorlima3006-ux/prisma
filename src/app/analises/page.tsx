import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = { title: 'Análises' };

export default function Page() {
  return (
    <ComingSoon
      title="Análises"
      phase={2}
      description="Área para análises de ativos e comparações lado a lado, com indicadores e fontes."
      links={[
        { label: 'Ações', href: '/acoes' },
        { label: 'FIIs', href: '/fiis' },
        { label: 'Educação', href: '/educacao' },
      ]}
    />
  );
}
