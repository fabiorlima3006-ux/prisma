import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type BadgeTone = 'demo' | 'real' | 'beginner' | 'intermediate' | 'advanced' | 'neutral';

const tones: Record<BadgeTone, string> = {
  demo: 'rounded-md border border-[#f1d68a] bg-[#fff3cd] px-2 py-1 tracking-[.8px] text-[#7a5600]',
  real: 'rounded-md border border-[#9fe3c4] bg-[#d9f7ea] px-2 py-1 tracking-[.8px] text-[#05603f]',
  beginner: 'rounded-full bg-[#d9f7ea] px-2 py-[3px] tracking-[.5px] text-[#05603f] uppercase',
  intermediate: 'rounded-full bg-[#dbe7ff] px-2 py-[3px] tracking-[.5px] text-[#0b3fa8] uppercase',
  advanced: 'rounded-full bg-[#efe4ff] px-2 py-[3px] tracking-[.5px] text-[#5b2bb5] uppercase',
  neutral: 'rounded-full bg-surface-2 px-2 py-[3px] tracking-[.5px] text-muted uppercase',
};

export function Badge({
  tone,
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone: BadgeTone }) {
  return (
    <span
      className={cn('inline-block text-[10px] font-extrabold', tones[tone], className)}
      {...rest}
    />
  );
}
