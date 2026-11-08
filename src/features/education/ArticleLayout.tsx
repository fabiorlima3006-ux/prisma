import Link from 'next/link';
import type { ReactNode } from 'react';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui';
import { TOOLS } from '@/lib/config/tools';
import { formatDate } from '@/lib/format';
import { LEVEL_LABEL, LEVEL_TONE } from './labels';
import type { ArticleMeta, Track } from './registry';

export function ArticleLayout({
  track,
  meta,
  children,
}: {
  track: Track;
  meta: ArticleMeta;
  children: ReactNode;
}) {
  const tools = meta.relatedTools.flatMap((id) => TOOLS.filter((t) => t.id === id));
  return (
    <>
      <PageHeader
        eyebrow={track.title}
        title={meta.title}
        description={meta.description}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Educação', href: '/educacao' },
          { label: track.title, href: `/educacao/${track.slug}` },
          { label: meta.title },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <p className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted">
          <Badge tone={LEVEL_TONE[meta.level]}>{LEVEL_LABEL[meta.level]}</Badge>
          <span>{meta.readingMinutes} min de leitura</span>
          <span>Atualizado em {formatDate(meta.updatedAt)}</span>
        </p>
        <article className="prose">{children}</article>
        {tools.length > 0 && (
          <aside aria-labelledby="related-tools" className="mt-10 max-w-[68ch]">
            <h2 id="related-tools" className="text-lg font-bold text-text">
              Ferramentas relacionadas
            </h2>
            <ul className="mt-3 space-y-2">
              {tools.map((t) => (
                <li key={t.id}>
                  <Link href={t.href} className="font-semibold text-accent underline">
                    {t.title}
                  </Link>
                  <span className="text-muted"> — {t.description}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <div className="mt-10 max-w-[68ch]">
          <Disclaimer variant="prominent" />
        </div>
      </div>
    </>
  );
}
