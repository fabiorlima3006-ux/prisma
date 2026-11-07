import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleLayout } from '@/features/education/ArticleLayout';
import { TRACKS, getTrack, loadArticle } from '@/features/education/registry';

export const dynamicParams = false;

type Params = Promise<{ trilha: string; artigo: string }>;

export function generateStaticParams() {
  return TRACKS.flatMap((t) => t.articles.map((artigo) => ({ trilha: t.slug, artigo })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { trilha, artigo } = await params;
  const article = await loadArticle(trilha, artigo);
  return article ? { title: article.meta.title, description: article.meta.description } : {};
}

export default async function ArtigoPage({ params }: { params: Params }) {
  const { trilha, artigo } = await params;
  const track = getTrack(trilha);
  const article = await loadArticle(trilha, artigo);
  if (!track || !article) notFound();
  const { Content, meta } = article;
  return (
    <ArticleLayout track={track} meta={meta}>
      <Content />
    </ArticleLayout>
  );
}
