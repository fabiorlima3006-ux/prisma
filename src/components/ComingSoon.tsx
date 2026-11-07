import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card } from '@/components/ui';

export function ComingSoon({
  title,
  phase,
  description,
  links,
}: {
  title: string;
  phase: 2 | 3 | 4;
  description: string;
  links?: { label: string; href: string }[];
}) {
  return (
    <>
      <PageHeader
        eyebrow="em construção"
        title={title}
        description={description}
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: title }]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <Card as="section">
          <p className="font-mono text-xs tracking-wider text-accent">{`// fase ${phase} do roadmap`}</p>
          <p className="mt-2 text-base text-text">
            Esta área está em construção e prevista para a Fase {phase} do roadmap.
          </p>
          {links && links.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm">Enquanto isso, você pode explorar:</p>
              <ul className="flex flex-wrap gap-3">
                {links.map((l) => (
                  <li key={l.href}>
                    <Button href={l.href} variant="secondary" size="sm">
                      {l.label}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
