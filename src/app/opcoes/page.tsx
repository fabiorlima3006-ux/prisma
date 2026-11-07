import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Opções',
  description: 'Área em construção sobre opções e derivativos.',
  path: '/opcoes',
});

export default function Page() {
  return (
    <ComingSoon
      title="Opções"
      phase={3}
      description="Área para estudar opções e derivativos, com simulações de payoff e explicações das gregas."
      links={[
        { label: 'Educação', href: '/educacao' },
        { label: 'Simuladores', href: '/simuladores' },
        { label: 'Mercados', href: '/mercados' },
      ]}
    />
  );
}
