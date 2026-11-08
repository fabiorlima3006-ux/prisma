'use client';

import { cloneElement, isValidElement, useEffect, useId, useState, type ReactElement } from 'react';

/**
 * Tooltip somente texto (sem conteúdo interativo): abre com hover ou foco e fecha com Esc,
 * inclusive quando aberto por hover (WCAG 1.4.13). O balão fica colado ao gatilho, sem lacuna,
 * para o ponteiro poder passar do gatilho ao balão sem fechá-lo.
 */
export function Tooltip({ content, children }: { content: string; children: ReactElement }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': open ? id : undefined,
      })
    : children;
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {trigger}
      {open && (
        // pb-2 é a "ponte" do ponteiro: o balão começa colado ao gatilho e o espaço visual
        // fica dentro do próprio elemento, então sair do gatilho para o balão não o fecha.
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-50 w-max max-w-[240px] -translate-x-1/2 pb-2"
        >
          <span className="block rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-text shadow-lg">
            {content}
          </span>
        </span>
      )}
    </span>
  );
}
