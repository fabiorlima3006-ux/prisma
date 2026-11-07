import type { Metadata } from 'next';
import Link from 'next/link';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Card } from '@/components/ui';
import { TOOLS } from '@/lib/config/tools';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Simuladores',
  description: 'Projete cenários e entenda o efeito do tempo, dos juros e dos aportes.',
  path: '/simuladores',
});

// O comparador pertence a /ferramentas (Tarefa 15); aqui entram os demais simuladores.
const SIMULATORS = TOOLS.filter((t) => t.id !== 'comparador');

export default function SimuladoresPage() {
  return (
    <>
      <PageHeader
        eyebrow="simuladores"
        title="Simuladores"
        description="Projete cenários e entenda o efeito do tempo, dos juros e dos aportes."
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: 'Simuladores' }]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SIMULATORS.map((tool) => (
            <li key={tool.id}>
              {tool.status === 'available' ? (
                <Link href={tool.href} className="block h-full">
                  <Card as="article" interactive className="h-full space-y-2">
                    <h2 className="text-base font-bold text-text">{tool.title}</h2>
                    <p>{tool.description}</p>
                    <p className="font-semibold text-accent">Simular →</p>
                  </Card>
                </Link>
              ) : (
                <Card as="article" className="h-full space-y-2">
                  <h2 className="text-base font-bold text-text">{tool.title}</h2>
                  <p>{tool.description}</p>
                  <p className="flex items-center gap-2">
                    <Badge tone="neutral">Em breve</Badge>
                    <span className="font-mono text-xs">{`Fase ${tool.phase}`}</span>
                  </p>
                </Card>
              )}
            </li>
          ))}
        </ul>
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
