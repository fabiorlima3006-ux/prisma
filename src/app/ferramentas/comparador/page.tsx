import type { Metadata } from 'next';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { TAX_RULES } from '@/lib/config/tax-rules';
import { marketData } from '@/lib/data';
import { ComparatorForm } from '@/features/fixed-income-comparator/ComparatorForm';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Comparador de renda fixa',
  description:
    'Compare poupança, CDB, Tesouro Selic, LCI e LCA considerando prazo, imposto e custos.',
  path: '/ferramentas/comparador',
});

export default async function ComparadorPage() {
  const [cdi, selic, tr] = await Promise.all([
    marketData.getIndicator('cdi'),
    marketData.getIndicator('selic'),
    marketData.getIndicator('tr'),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="ferramentas"
        title="Comparador de renda fixa"
        description="Compare poupança, CDB, Tesouro Selic, LCI e LCA considerando prazo, imposto e custos."
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Ferramentas', href: '/ferramentas' },
          { label: 'Comparador' },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <ComparatorForm rates={{ cdi, selic, tr }} rules={TAX_RULES} />
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
