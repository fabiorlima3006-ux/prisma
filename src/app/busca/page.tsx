import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchResults } from '@/components/search/SearchResults';
import { buildSearchIndex } from '@/lib/search/build-index';
import { search } from '@/lib/search/search';

type Props = { searchParams: Promise<{ q?: string | string[] }> };

async function readQuery(searchParams: Props['searchParams']): Promise<string> {
  const { q } = await searchParams;
  return (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 100) ?? '';
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await readQuery(searchParams);
  return q ? { title: `Busca: ${q}` } : { title: 'Busca', robots: { index: false } };
}

export default async function BuscaPage({ searchParams }: Props) {
  const q = await readQuery(searchParams);
  const results = q ? search(q, await buildSearchIndex(), 50) : [];
  return (
    <>
      <PageHeader
        eyebrow="busca"
        title="Busca"
        description="Ativos, ferramentas, artigos e páginas."
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <form action="/busca" method="get" role="search" className="mb-8 flex gap-2">
          <label htmlFor="q" className="sr-only">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Buscar ativos, ferramentas e artigos"
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2"
          />
          <button type="submit" className="rounded-lg bg-hero px-4 py-2 font-bold text-white">
            Buscar
          </button>
        </form>
        {q && results.length === 0 && <p>{`Nenhum resultado para “${q}”.`}</p>}
        {results.length > 0 && <SearchResults results={results} />}
      </div>
    </>
  );
}
