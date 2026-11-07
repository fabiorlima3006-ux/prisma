'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { siteConfig } from '@/lib/config/site';

export function MobileNav({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    root.current?.querySelector<HTMLElement>('a')?.focus();
  }, []);
  const link = 'block rounded-lg px-3 py-2.5 text-sm text-white hover:bg-white/10';
  return (
    <div
      ref={root}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Menu principal"
      className="fixed inset-x-0 top-[var(--header-h)] bottom-0 z-40 overflow-y-auto bg-hero p-4 text-white lg:hidden"
    >
      <nav aria-label="Navegação">
        <ul className="space-y-1">
          {siteConfig.nav.map((item) => (
            <li key={item.href}>
              {item.children ? (
                <>
                  <span className="block px-3 py-2.5 text-sm font-semibold text-white/70">
                    {item.label}
                  </span>
                  <ul className="ml-4 space-y-1 border-l border-white/15 pl-2">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} onClick={onNavigate} className={link}>
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link href={item.href} onClick={onNavigate} className={link}>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-6 mb-2 px-3 font-mono text-xs text-white/50">{'// Mais'}</p>
        <ul className="space-y-1">
          {siteConfig.userNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={onNavigate} className={link}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/entrar" onClick={onNavigate} className={link}>
              Entrar
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
