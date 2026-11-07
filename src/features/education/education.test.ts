import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TOOLS } from '@/lib/config/tools';
import { TRACKS, articleMetaSchema, listArticles, loadArticle } from './registry';

const CONTENT_DIR = join(process.cwd(), 'content', 'educacao');

function mdxFiles(): { path: string; track: string; slug: string; text: string }[] {
  return readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(join(CONTENT_DIR, d.name))
        .filter((f) => f.endsWith('.mdx'))
        .map((f) => {
          const path = join(CONTENT_DIR, d.name, f);
          return {
            path,
            track: d.name,
            slug: f.replace(/\.mdx$/, ''),
            text: readFileSync(path, 'utf8'),
          };
        }),
    );
}

function countWords(source: string): number {
  const body = source
    .replace(/^export const meta = \{[\s\S]*?^\};?$/m, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\]\(\/[^)]*\)/g, ' ')
    .replace(/[#*_`>|\[\]()]/g, ' ');
  return body.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

describe('educação', () => {
  it('lista 9 artigos em 3 trilhas com metadados válidos', async () => {
    const all = await listArticles();
    expect(all).toHaveLength(9);
    expect(TRACKS.map((t) => t.articles.length)).toEqual([3, 3, 3]);
    all.forEach((a) => expect(articleMetaSchema.safeParse(a).success).toBe(true));
    all.forEach((a) =>
      a.relatedTools.forEach((id) => expect(TOOLS.some((t) => t.id === id)).toBe(true)),
    );
    all.forEach((a) => expect(a.updatedAt).toBe('2026-11-07'));
  });

  it('o nível do artigo corresponde à trilha', async () => {
    const all = await listArticles();
    all.forEach((a) => expect(a.level).toBe(a.track));
  });

  it('artigo inexistente retorna null; existente retorna conteúdo', async () => {
    expect(await loadArticle('iniciante', 'nao-existe')).toBeNull();
    expect(await loadArticle('nao-existe', 'juros-compostos-e-inflacao')).toBeNull();
    const a = await loadArticle('iniciante', 'juros-compostos-e-inflacao');
    expect(a?.meta.level).toBe('iniciante');
    expect(typeof a?.Content).toBe('function');
  });

  it('todo .mdx em content/ está registrado em TRACKS', () => {
    const registered = TRACKS.flatMap((t) => t.articles.map((s) => `${t.slug}/${s}`)).sort();
    expect(
      mdxFiles()
        .map((f) => `${f.track}/${f.slug}`)
        .sort(),
    ).toEqual(registered);
  });

  it('linguagem proibida não aparece nos textos', () => {
    for (const f of mdxFiles()) {
      expect(f.text, f.path).not.toMatch(
        /\b(compre|venda agora|garantid[oa]s?|melhor investimento|fique rico|barat[oa]s?|car[oa]s?|oportunidades?)\b/i,
      );
    }
  });

  it('cada artigo tem entre 600 e 1200 palavras', () => {
    for (const f of mdxFiles()) {
      const n = countWords(f.text);
      expect(n, `${f.path}: ${n}`).toBeGreaterThanOrEqual(600);
      expect(n, `${f.path}: ${n}`).toBeLessThanOrEqual(1200);
    }
  });
});
