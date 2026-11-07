import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = { title: 'Notícias' };

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
