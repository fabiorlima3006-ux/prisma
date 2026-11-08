import type { Metadata } from 'next';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { RetirementForm } from '@/features/retirement/RetirementForm';
import { fromSearchParams } from '@/features/retirement/url-state';
import { buildMetadata } from '@/lib/seo/metadata';

const DESCRIPTION = 'Estime o patrimônio para viver de rendimentos e em quanto tempo chegar lá.';

export const metadata: Metadata = buildMetadata({
  title: 'Aposentadoria e independência financeira',
  description: DESCRIPTION,
  path: '/simuladores/independencia-financeira',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function IndependenciaFinanceiraPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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
        title="Aposentadoria e independência financeira"
        description={DESCRIPTION}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Simuladores', href: '/simuladores' },
          { label: 'Aposentadoria e independência financeira' },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <RetirementForm initial={values} />
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
