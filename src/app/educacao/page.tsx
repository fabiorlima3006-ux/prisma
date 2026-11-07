import type { Metadata } from 'next';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { TrackCard } from '@/features/education/TrackCard';
import { TRACKS } from '@/features/education/registry';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Educação financeira',
  description:
    'Trilhas de estudo do básico aos derivativos, em linguagem simples e com foco em risco.',
  path: '/educacao',
});

export default function EducacaoPage() {
  return (
    <>
      <PageHeader
        eyebrow="educação"
        title="Educação financeira"
        description="Trilhas de estudo do básico aos derivativos, em linguagem simples e com foco em risco."
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: 'Educação' }]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <ul className="grid gap-4 md:grid-cols-3">
          {TRACKS.map((t) => (
            <li key={t.slug}>
              <TrackCard track={t} />
            </li>
          ))}
        </ul>
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
