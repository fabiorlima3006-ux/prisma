'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export function Dropdown({
  label,
  items,
}: {
  label: string;
  items: { label: string; href: string }[];
}) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  function focusItem(i: number) {
    const n = items.length;
    if (n === 0) return;
    links.current[((i % n) + n) % n]?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
      button.current?.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const down = e.key === 'ArrowDown';
    if (!open) {
      setOpen(true);
      requestAnimationFrame(() => focusItem(down ? 0 : -1));
      return;
    }
    const current = links.current.findIndex((l) => l === document.activeElement);
    if (current === -1) focusItem(down ? 0 : -1);
    else focusItem(current + (down ? 1 : -1));
  }

  return (
    <div
      ref={wrapper}
      className="relative"
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        // Fecha ao sair do componente com Tab (o foco foi para fora do wrapper).
        const next = e.relatedTarget as Node | null;
        if (open && next && !e.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold"
      >
        {label}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul
          id={menuId}
          className="absolute top-full left-0 z-50 mt-2 min-w-48 rounded-xl border border-line bg-surface p-1 shadow-lg"
        >
          {items.map((item, i) => (
            <li key={item.href}>
              <Link
                href={item.href}
                ref={(el) => {
                  links.current[i] = el;
                }}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-text hover:bg-surface-2"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
