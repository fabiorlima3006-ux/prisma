import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Assistente',
  description:
    'Área em construção para um assistente educacional que explica conceitos e indicadores.',
  path: '/assistente',
});

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
