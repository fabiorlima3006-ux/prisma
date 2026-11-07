import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'article' | 'section';
  interactive?: boolean;
};

export function Card({ as: Tag = 'div', interactive = false, className, ...rest }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-line bg-surface p-3.5 text-[12.5px] text-muted',
        interactive &&
          'transition hover:-translate-y-[3px] hover:shadow-[0_10px_24px_rgba(4,15,34,.14)]',
        className,
      )}
      {...rest}
    />
  );
}
