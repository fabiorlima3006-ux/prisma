'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { prefersReducedMotion } from './particles';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import './illustrations.css';

const HEIGHTS = [18, 26, 36, 48, 62, 80];

/** Barras decorativas de crescimento (SVG). Animam uma única vez ao entrar na tela. */
export function GrowthBars() {
  const [ref, inView] = useInViewOnce<SVGSVGElement>();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    // Só depois de montar as barras recolhem para animar; sem JS ou com reduced motion ficam visíveis.
    if (!prefersReducedMotion()) queueMicrotask(() => setArmed(true));
  }, []);
  return (
    <svg
      ref={ref}
      viewBox="0 0 180 90"
      aria-hidden="true"
      focusable="false"
      className={`h-24 w-full ${armed ? 'gb-armed' : ''} ${inView ? 'gb-in' : ''}`}
    >
      {HEIGHTS.map((h, i) => (
        <rect
          key={i}
          className="gb-bar"
          style={{ '--i': i } as CSSProperties}
          x={6 + i * 29}
          y={86 - h}
          width={20}
          height={h}
          rx={3}
          fill="var(--accent)"
          opacity={0.45 + i * 0.1}
        />
      ))}
    </svg>
  );
}
