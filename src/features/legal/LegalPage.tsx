import type { ReactNode } from 'react';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';

export type LegalSection = { heading: string; body: ReactNode };

export function LegalPage({
  title,
  description,
  sections,
  withDisclaimer = true,
}: {
  title: string;
  description: string;
  sections: LegalSection[];
  withDisclaimer?: boolean;
}) {
  return (
    <>
      <PageHeader
        eyebrow="institucional"
        title={title}
        description={description}
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: title }]}
      />
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        {sections.map((s) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="text-xl font-extrabold text-text">{s.heading}</h2>
            <div className="space-y-2 text-base leading-relaxed text-muted">{s.body}</div>
          </section>
        ))}
        {withDisclaimer && <Disclaimer variant="prominent" />}
      </div>
    </>
  );
}
