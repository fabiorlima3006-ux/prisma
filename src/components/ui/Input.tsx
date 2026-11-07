import type { InputHTMLAttributes, Ref } from 'react';
import { cn } from './cn';

export const controlClass =
  'w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-text placeholder:text-muted aria-[invalid=true]:border-down';

export function Input({
  className,
  ref,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={cn(controlClass, className)} {...rest} />;
}
