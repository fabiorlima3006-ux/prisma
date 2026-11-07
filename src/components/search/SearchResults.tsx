import Link from 'next/link';
import { groupByType, TYPE_LABELS, type SearchEntry } from '@/lib/search/search';

export function SearchResults({ results }: { results: SearchEntry[] }) {
  return (
    <div className="space-y-8">
      {groupByType(results).map((g) => (
        <section key={g.type} aria-labelledby={`grupo-${g.type}`}>
          <h2 id={`grupo-${g.type}`} className="mb-3 font-mono text-xs tracking-wider text-muted">
            {`// ${TYPE_LABELS[g.type]}`}
          </h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {g.items.map((e) => (
              <li key={e.type + e.href + e.title}>
                <Link href={e.href} className="block px-4 py-3 hover:bg-surface-2">
                  <span className="font-bold">{e.title}</span>
                  {e.subtitle && <span className="block text-sm text-muted">{e.subtitle}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
