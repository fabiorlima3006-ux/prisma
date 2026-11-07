import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Notícias',
  description: 'Área em construção para notícias do mercado financeiro.',
  path: '/noticias',
});

export default function Page() {
  return (
    <ComingSoon
      title="Notícias"
      phase={2}
      description="Área para notícias do mercado e dos ativos acompanhados, sempre com a fonte."
      links={[
        { label: 'Mercados', href: '/mercados' },
        { label: 'Educação', href: '/educacao' },
      ]}
    />
  );
}
