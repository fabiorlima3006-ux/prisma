'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Retorna true (e permanece true) depois que o elemento entra na tela pela primeira vez.
 * `rootMargin` antecipa a entrada (ex.: '200px' carrega um pouco antes de aparecer).
 * Elementos ocultos (`hidden`, display: none) nunca intersectam: ficam false até aparecerem.
 */
export function useInViewOnce<T extends Element>({
  rootMargin = '0px',
  threshold = 0.25,
}: { rootMargin?: string; threshold?: number } = {}): [ref: RefObject<T | null>, inView: boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      queueMicrotask(() => setInView(true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin, threshold]);

  return [ref, inView];
}
