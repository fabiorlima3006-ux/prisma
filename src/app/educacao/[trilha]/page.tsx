import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui';
import { LEVEL_LABEL, LEVEL_TONE } from '@/features/education/labels';
import { buildMetadata } from '@/lib/seo/metadata';
import { TRACKS, getTrack, loadArticle } from '@/features/education/registry';

export const dynamicParams = false;

type Params = Promise<{ trilha: string }>;

export function generateStaticParams() {
  return TRACKS.map((t) => ({ trilha: t.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const track = getTrack((await params).trilha);
  if (!track) return {};
  return buildMetadata({
    title: track.title,
    description: track.description,
    path: `/educacao/${track.slug}`,
  });
}

export default async function TrilhaPage({ params }: { params: Params }) {
  const track = getTrack((await params).trilha);
  if (!track) notFound();
  const articles = await Promise.all(
    track.articles.map(async (slug) => ({ slug, article: await loadArticle(track.slug, slug) })),
  );
  return (
    <>
      <PageHeader
        eyebrow="educação"
        title={track.title}
        description={track.description}
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Educação', href: '/educacao' },
          { label: track.title },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <Badge tone={LEVEL_TONE[track.slug]}>{LEVEL_LABEL[track.slug]}</Badge>
        <ol className="space-y-3">
          {articles.map(({ slug, article }, i) =>
            article ? (
              <li key={slug} className="rounded-xl border border-line bg-surface p-5">
                <p className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</p>
                <h2 className="mt-1 text-lg font-bold text-text">
                  <Link href={`/educacao/${track.slug}/${slug}`} className="hover:underline">
                    {article.meta.title}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-muted">{article.meta.description}</p>
                <p className="mt-2 text-xs text-muted">
                  {article.meta.readingMinutes} min de leitura
                </p>
              </li>
            ) : null,
          )}
        </ol>
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
