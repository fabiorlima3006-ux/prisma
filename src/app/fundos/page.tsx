import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata: Metadata = { title: 'Fundos de investimento' };

export default function Page() {
  return (
    <ComingSoon
      title="Fundos de investimento"
      phase={2}
      description="Área para estudar fundos de investimento, seus custos e sua tributação."
      links={[
        { label: 'Renda fixa', href: '/renda-fixa' },
        { label: 'ETFs', href: '/etfs' },
        { label: 'Educação', href: '/educacao' },
      ]}
    />
  );
}
