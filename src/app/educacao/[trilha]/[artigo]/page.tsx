import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleLayout } from '@/features/education/ArticleLayout';
import { JsonLd } from '@/components/JsonLd';
import { articleJsonLd } from '@/lib/seo/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { TRACKS, getTrack, loadArticle } from '@/features/education/registry';

export const dynamicParams = false;

type Params = Promise<{ trilha: string; artigo: string }>;

export function generateStaticParams() {
  return TRACKS.flatMap((t) => t.articles.map((artigo) => ({ trilha: t.slug, artigo })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { trilha, artigo } = await params;
  const article = await loadArticle(trilha, artigo);
  if (!article) return {};
  return buildMetadata({
    title: article.meta.title,
    description: article.meta.description,
    path: `/educacao/${trilha}/${artigo}`,
    type: 'article',
    updatedAt: article.meta.updatedAt,
  });
}

export default async function ArtigoPage({ params }: { params: Params }) {
  const { trilha, artigo } = await params;
  const track = getTrack(trilha);
  const article = await loadArticle(trilha, artigo);
  if (!track || !article) notFound();
  const { Content, meta } = article;
  return (
    <ArticleLayout track={track} meta={meta}>
      <JsonLd data={articleJsonLd(meta, `/educacao/${trilha}/${artigo}`)} />
      <Content />
    </ArticleLayout>
  );
}
