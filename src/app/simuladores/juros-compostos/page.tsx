import type { Metadata } from 'next';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { CompoundInterestForm } from '@/features/compound-interest/CompoundInterestForm';
import { fromSearchParams } from '@/features/compound-interest/url-state';

export const metadata: Metadata = { title: 'Simulador de juros compostos' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function JurosCompostosPage({ searchParams }: { searchParams: SearchParams }) {
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
        title="Simulador de juros compostos"
        description="Veja como aportes mensais e o tempo fazem o patrimônio evoluir."
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Simuladores', href: '/simuladores' },
          { label: 'Juros compostos' },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <CompoundInterestForm initial={values} />
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
