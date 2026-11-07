'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button, Dropdown } from '@/components/ui';
import { siteConfig } from '@/lib/config/site';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggle = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 h-[72px] px-3 pt-3 text-white sm:px-4">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 rounded-2xl border border-white/12 bg-white/6 px-3 backdrop-blur-md">
        <Link href="/" className="mr-1 text-lg font-extrabold tracking-tight">
          {siteConfig.name}
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {siteConfig.nav.map((item) =>
            item.children ? (
              <Dropdown key={item.href} label={item.label} items={item.children} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1 text-sm font-semibold hover:bg-white/10"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Buscar (Ctrl+K)"
            aria-keyshortcuts="Control+K Meta+K"
            onClick={() => window.dispatchEvent(new Event('open-search'))}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 px-3 text-xs text-white/75 hover:bg-white/10"
          >
            <span aria-hidden="true">⌕</span>
            <span className="hidden sm:inline">Buscar ativo, tema…</span>
          </button>
          <ThemeToggle />
          <div className="hidden lg:block">
            <Dropdown label="Mais" items={siteConfig.userNav} />
          </div>
          <Button
            href="/entrar"
            variant="ghost"
            size="sm"
            className="hidden border border-white/25 text-white hover:bg-white/10 lg:inline-flex"
          >
            Entrar
          </Button>
          <button
            ref={toggle}
            type="button"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 hover:bg-white/10 lg:hidden"
          >
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
      {open && <MobileNav id={menuId} onNavigate={close} />}
    </header>
  );
}
