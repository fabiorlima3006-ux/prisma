import { normalize } from './normalize';

export type SearchEntryType = 'asset' | 'article' | 'tool' | 'page';

export type SearchEntry = {
  type: SearchEntryType;
  title: string;
  subtitle?: string;
  href: string;
  keywords: string[];
};

const TYPE_ORDER: Record<SearchEntryType, number> = { asset: 0, tool: 1, article: 2, page: 3 };

export const TYPE_LABELS: Record<SearchEntryType, string> = {
  asset: 'Ativos',
  tool: 'Ferramentas',
  article: 'Artigos',
  page: 'Páginas',
};

function scoreWord(word: string, title: string, rest: string[]): number {
  if (title === word) return 100;
  if (title.startsWith(word)) return 50;
  if (title.includes(word)) return 20;
  if (rest.some((f) => f.includes(word))) return 10;
  return 0;
}

export function search(query: string, index: SearchEntry[], limit = 8): SearchEntry[] {
  const words = normalize(query).split(' ').filter(Boolean);
  if (words.length === 0) return [];
  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of index) {
    const title = normalize(entry.title);
    const rest = [...entry.keywords, entry.subtitle ?? ''].map(normalize);
    let total = 0;
    let all = true;
    for (const w of words) {
      const s = scoreWord(w, title, rest);
      if (s === 0) {
        all = false;
        break;
      }
      total += s;
    }
    if (all) scored.push({ entry, score: total });
  }
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      TYPE_ORDER[a.entry.type] - TYPE_ORDER[b.entry.type] ||
      a.entry.title.localeCompare(b.entry.title, 'pt-BR'),
  );
  return scored.slice(0, limit).map((s) => s.entry);
}

export function groupByType(
  entries: SearchEntry[],
): { type: SearchEntryType; items: SearchEntry[] }[] {
  return (Object.keys(TYPE_ORDER) as SearchEntryType[])
    .sort((a, b) => TYPE_ORDER[a] - TYPE_ORDER[b])
    .map((type) => ({ type, items: entries.filter((e) => e.type === type) }))
    .filter((g) => g.items.length > 0);
}
