'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './cn';

export type TabItem = { id: string; label: string; content: ReactNode };

export function Tabs({
  items,
  initialId,
  onChange,
}: {
  items: TabItem[];
  /** Aba selecionada na primeira renderização (padrão: a primeira). */
  initialId?: string;
  /** Chamado quando o usuário troca de aba. */
  onChange?: (id: string) => void;
}) {
  const base = useId();
  const [selected, setSelected] = useState(
    initialId && items.some((i) => i.id === initialId) ? initialId : items[0]?.id,
  );
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function select(id: string) {
    setSelected(id);
    onChange?.(id);
  }

  function onKeyDown(e: KeyboardEvent, index: number) {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;
    e.preventDefault();
    const target = items[next];
    if (!target) return;
    select(target.id);
    refs.current[target.id]?.focus();
  }

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-line">
        {items.map((item, i) => {
          const active = item.id === selected;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[item.id] = el;
              }}
              role="tab"
              type="button"
              id={`${base}-tab-${item.id}`}
              aria-selected={active}
              aria-controls={`${base}-panel-${item.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => select(item.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                '-mb-px border-b-[3px] px-4 py-2 text-sm font-bold',
                active
                  ? 'border-accent text-text'
                  : 'border-transparent text-muted hover:text-text',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-panel-${item.id}`}
          aria-labelledby={`${base}-tab-${item.id}`}
          hidden={item.id !== selected}
          tabIndex={0}
          className="pt-4"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
