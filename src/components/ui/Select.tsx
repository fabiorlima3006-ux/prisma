import type { Ref, SelectHTMLAttributes } from 'react';
import { cn } from './cn';
import { controlClass } from './Input';

export function Select({
  className,
  ref,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return <select ref={ref} className={cn(controlClass, className)} {...rest} />;
}
