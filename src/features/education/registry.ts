import type { ComponentType } from 'react';
import { z } from 'zod';
import { LEVELS, TRACKS, type Track, type TrackSlug } from './tracks';

export { TRACKS, type Track, type TrackSlug };

export const articleMetaSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  level: z.enum(LEVELS),
  readingMinutes: z.number().int().positive(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  terms: z.array(z.string()),
  relatedTools: z.array(z.string()),
});

export type ArticleMeta = z.infer<typeof articleMetaSchema>;

type MdxModule = { default: ComponentType; meta?: unknown };

// Mapa explícito para que o bundler resolva cada arquivo estaticamente.
const LOADERS: Record<string, () => Promise<MdxModule>> = {
  'iniciante/juros-compostos-e-inflacao': () =>
    import('../../../content/educacao/iniciante/juros-compostos-e-inflacao.mdx'),
  'iniciante/risco-retorno-e-liquidez': () =>
    import('../../../content/educacao/iniciante/risco-retorno-e-liquidez.mdx'),
  'iniciante/renda-fixa-basica': () =>
    import('../../../content/educacao/iniciante/renda-fixa-basica.mdx'),
  'intermediario/indicadores-fundamentalistas': () =>
    import('../../../content/educacao/intermediario/indicadores-fundamentalistas.mdx'),
  'intermediario/fiis': () => import('../../../content/educacao/intermediario/fiis.mdx'),
  'intermediario/etfs-e-diversificacao': () =>
    import('../../../content/educacao/intermediario/etfs-e-diversificacao.mdx'),
  'avancado/introducao-a-opcoes': () =>
    import('../../../content/educacao/avancado/introducao-a-opcoes.mdx'),
  'avancado/volatilidade-e-gregas': () =>
    import('../../../content/educacao/avancado/volatilidade-e-gregas.mdx'),
  'avancado/gestao-de-risco': () =>
    import('../../../content/educacao/avancado/gestao-de-risco.mdx'),
};

export async function loadArticle(
  track: string,
  slug: string,
): Promise<{ meta: ArticleMeta; Content: ComponentType } | null> {
  const loader = Object.hasOwn(LOADERS, `${track}/${slug}`)
    ? LOADERS[`${track}/${slug}`]
    : undefined;
  if (!loader) return null;
  const mod = await loader();
  return { meta: articleMetaSchema.parse(mod.meta), Content: mod.default };
}

export async function listArticles(): Promise<(ArticleMeta & { track: string; slug: string })[]> {
  const out: (ArticleMeta & { track: string; slug: string })[] = [];
  for (const t of TRACKS) {
    for (const slug of t.articles) {
      const a = await loadArticle(t.slug, slug);
      if (a) out.push({ ...a.meta, track: t.slug, slug });
    }
  }
  return out;
}

export function getTrack(slug: string): Track | undefined {
  return TRACKS.find((t) => t.slug === slug);
}
