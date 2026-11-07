import type { Metadata } from 'next';
import Link from 'next/link';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui';
import { TOOLS } from '@/lib/config/tools';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Ferramentas',
  description: 'Ferramentas para comparar alternativas e entender o efeito de prazo e imposto.',
  path: '/ferramentas',
});

export default function FerramentasPage() {
  const comparador = TOOLS.find((t) => t.id === 'comparador');
  return (
    <>
      <PageHeader
        eyebrow="ferramentas"
        title="Ferramentas"
        description="Ferramentas para comparar alternativas e entender o efeito de prazo e imposto."
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: 'Ferramentas' }]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comparador && (
            <li>
              <Link href={comparador.href} className="block h-full">
                <Card as="article" interactive className="h-full space-y-2">
                  <h2 className="text-base font-bold text-text">{comparador.title}</h2>
                  <p>{comparador.description}</p>
                  <p className="font-semibold text-accent">Comparar →</p>
                </Card>
              </Link>
            </li>
          )}
          <li>
            <Link href="/simuladores" className="block h-full">
              <Card as="article" interactive className="h-full space-y-2">
                <h2 className="text-base font-bold text-text">Simuladores</h2>
                <p>Projete cenários de juros, aportes e prazos.</p>
                <p className="font-semibold text-accent">Ver simuladores →</p>
              </Card>
            </Link>
          </li>
        </ul>
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
