import type { Metadata } from 'next';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { FinancingForm } from '@/features/financing/FinancingForm';
import { fromSearchParams } from '@/features/financing/url-state';
import { buildMetadata } from '@/lib/seo/metadata';

const TITLE = 'Financiamento: SAC e Price';
const DESCRIPTION =
  'Compare parcelas e juros totais nos sistemas SAC e Price, com amortização extra.';

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/simuladores/financiamento',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FinanciamentoPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) sp.set(key, first);
  }
  const { values } = fromSearchParams(sp);
  return (
    <>
      <PageHeader
        eyebrow="simuladores"
        title={TITLE}
        description={DESCRIPTION}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Simuladores', href: '/simuladores' },
          { label: TITLE },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <FinancingForm initial={values} />
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
