'use client';

import { useEffect, useRef } from 'react';
import { CYAN, prefersReducedMotion, seededRandom, watchSize, watchVisibility } from './particles';

type Dot = { x: number; y: number; v: number };

/** Tempo máximo de movimento (WCAG 2.2.2): depois disso o último quadro fica congelado. */
export const FLOW_BAND_DURATION_MS = 5000;

/** Faixa fina de pontos que "descem" do hero para o conteúdo. Decorativa. */
export function FlowBand({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = prefersReducedMotion();
    const rand = seededRandom(99);
    const dots: Dot[] = Array.from({ length: 160 }, () => ({
      x: rand(),
      y: rand(),
      v: 0.15 + rand() * 0.5,
    }));
    let W = 0;
    let H = 0;
    let raf = 0;
    let running = false;
    let done = false;
    let elapsed = 0;
    let last: number | null = null;

    const draw = (advance: boolean) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = CYAN;
      for (const d of dots) {
        if (advance) {
          d.y += (d.v / Math.max(H, 1)) * 3;
          if (d.y > 1) {
            d.y = 0;
            d.x = 0.35 + rand() * 0.3 + (rand() - 0.5) * 0.4;
          }
        }
        ctx.globalAlpha = 1 - d.y * 0.8;
        ctx.fillRect(W * (0.5 + (d.x - 0.5) * (1 - d.y * 0.6)), d.y * H, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
    };
    const tick = (now: number) => {
      if (!running) return;
      if (last !== null) elapsed += now - last;
      last = now;
      draw(true);
      if (elapsed >= FLOW_BAND_DURATION_MS) {
        done = true;
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const measure = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce || done) draw(false);
    };
    const setRunning = (on: boolean) => {
      if (done || on === running) return;
      running = on;
      last = null;
      if (on) raf = requestAnimationFrame(tick);
      else cancelAnimationFrame(raf);
    };

    measure();
    const stopSize = watchSize(canvas, measure);
    const stopVisible = reduce ? () => {} : watchVisibility(canvas, setRunning);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      stopSize();
      stopVisible();
    };
  }, []);

  return (
    <div className={`relative h-20 w-full ${className}`} aria-hidden="true">
      <canvas ref={ref} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
