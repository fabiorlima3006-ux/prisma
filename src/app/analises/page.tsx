import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Análises',
  description: 'Área em construção para análises de ativos e comparações lado a lado.',
  path: '/analises',
});

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
