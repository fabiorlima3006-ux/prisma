import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Common = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  /** Brilho que passa + glow do mockup. Use só no hero. */
  shine?: boolean;
  children?: ReactNode;
  className?: string;
};
type AsButton = Common & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof Common
  >;
type AsLink = Common & { href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof Common | 'href'
  >;
export type ButtonProps = AsButton | AsLink;

const variants = {
  primary: 'bg-gradient-to-br from-[#2fd3ff] to-[#5b8cff] text-[#051933] hover:brightness-105',
  secondary: 'border-[1.5px] border-line bg-surface text-text hover:bg-surface-2',
  ghost: 'text-text hover:bg-surface-2',
} as const;
const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-[18px] py-[11px] text-[13px]' } as const;

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', shine = false, className, children, ...rest } = props;
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
    shine && 'btn-shine',
    className,
  );
  if (typeof rest.href === 'string') {
    const { href, ...anchor } = rest as Omit<AsLink, keyof Common>;
    return (
      <Link href={href} className={classes} {...anchor}>
        {children}
      </Link>
    );
  }
  const { href: _href, ...button } = rest as Omit<AsButton, keyof Common>;
  void _href;
  return (
    <button type="button" className={classes} {...button}>
      {children}
    </button>
  );
}
