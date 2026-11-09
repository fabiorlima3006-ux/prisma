import type { ReactNode } from 'react';
import { cn } from './cn';

export type TableColumn = { key: string; label: string; align?: 'left' | 'right' | 'center' };

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

export function Table({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: TableColumn[];
  rows: Record<string, ReactNode>[];
}) {
  return (
    // Região rolável precisa de foco por teclado (axe: scrollable-region-focusable).
    <div
      role="region"
      aria-label={caption}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="overflow-x-auto rounded-xl border border-line bg-surface"
    >
      <table className="w-full border-collapse text-sm">
        <caption className="px-3.5 py-2.5 text-left font-mono text-xs text-muted">
          {caption}
        </caption>
        <thead>
          <tr className="bg-surface-2">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'px-3.5 py-2 text-xs font-bold text-muted',
                  alignClass[c.align ?? 'left'],
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-line">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'px-3.5 py-2 text-text',
                    alignClass[c.align ?? 'left'],
                    c.align === 'right' && 'font-mono tabular-nums',
                  )}
                >
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
