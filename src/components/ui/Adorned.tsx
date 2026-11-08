import type { ReactNode } from 'react';

const adornment =
  'pointer-events-none absolute top-1/2 -translate-y-1/2 font-mono text-sm text-muted';

/** Envolve um campo com prefixo ("R$") e/ou sufixo ("%") decorativos (aria-hidden). */
export function Adorned({
  prefix,
  suffix,
  children,
}: {
  prefix?: string;
  suffix?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span aria-hidden="true" className={`${adornment} left-3`}>
          {prefix}
        </span>
      )}
      {children}
      {suffix && (
        <span aria-hidden="true" className={`${adornment} right-3`}>
          {suffix}
        </span>
      )}
    </div>
  );
}
