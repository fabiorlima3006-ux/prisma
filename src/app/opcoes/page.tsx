import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = { title: 'Opções' };

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
