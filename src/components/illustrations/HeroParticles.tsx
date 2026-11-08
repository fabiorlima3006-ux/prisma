'use client';

import { useEffect, useRef } from 'react';
import {
  CYAN,
  PARTICLE_COUNT,
  chartPoints,
  fibonacciSphere,
  isSmallScreen,
  prefersReducedMotion,
  watchSize,
  watchVisibility,
  whenIdle,
} from './particles';
import { seededRandom } from '@/lib/random';

type Particle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  s: number;
  a: number;
};
type Mode = 'sphere' | 'explode' | 'morph' | 'formed';

/** Monta a animação no canvas e devolve a limpeza (ou undefined sem contexto 2D). */
function startParticles(canvas: HTMLCanvasElement): (() => void) | undefined {
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  // Movimento reduzido ou tela pequena: só o quadro final, sem animação.
  const still = prefersReducedMotion() || isSmallScreen();
  const N = PARTICLE_COUNT;
  const sphere = fibonacciSphere(N);
  const P: Particle[] = sphere.map(() => ({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    vx: 0,
    vy: 0,
    s: 1.6,
    a: 1,
  }));
  let W = 0;
  let H = 0;
  let mode: Mode = 'sphere';
  let t0: number | null = null;
  let rot = 0;
  let raf = 0;
  let running = false;

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = CYAN;
    for (const p of P) {
      ctx.globalAlpha = p.a;
      ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1;
  };

  const assignTargets = () => {
    const pts = chartPoints(W, H, N, seededRandom(7));
    P.forEach((p, i) => {
      const q = pts[i];
      if (q) {
        p.tx = q[0];
        p.ty = q[1];
      }
    });
  };

  const showFinal = () => {
    for (const p of P) {
      p.x = p.tx;
      p.y = p.ty;
      p.s = 1.8;
      p.a = 1;
    }
    mode = 'formed';
    draw();
  };

  const measure = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width;
    H = r.height;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    assignTargets();
    // Parado (sem animação ou já formado): redesenha o quadro final no novo tamanho.
    if (still || mode === 'formed') showFinal();
  };

  const rand = seededRandom(42);
  const tick = (now: number) => {
    if (!running) return;
    if (t0 === null) t0 = now;
    const el = (now - t0) / 1000;
    rot += 0.006;
    if (mode === 'sphere') {
      const cr = Math.cos(rot);
      const sr = Math.sin(rot);
      const R = Math.min(W, H) * 0.36;
      sphere.forEach(([x, y, z], i) => {
        const p = P[i];
        if (!p) return;
        const X = x * cr - z * sr;
        const Z = x * sr + z * cr;
        const k = 1 / (1.9 - Z * 0.5);
        const d = (Z + 1) / 2;
        p.x = W / 2 + X * R * k * 1.4;
        p.y = H / 2 + y * R * k * 1.4;
        p.s = 1 + d * 1.8;
        p.a = 0.35 + d * 0.65;
      });
      if (el > 2.2) {
        mode = 'explode';
        t0 = now;
        for (const p of P) {
          const a = rand() * Math.PI * 2;
          const v = 2 + rand() * 5;
          p.vx = Math.cos(a) * v;
          p.vy = Math.sin(a) * v;
        }
      }
    } else if (mode === 'explode') {
      for (const p of P) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;
      }
      if (el > 0.45) {
        mode = 'morph';
        t0 = now;
      }
    } else if (mode === 'morph') {
      for (const p of P) {
        p.x += (p.tx - p.x) * 0.08;
        p.y += (p.ty - p.y) * 0.08;
        p.s += (1.8 - p.s) * 0.1;
        p.a += (1 - p.a) * 0.1;
      }
      if (el > 2) {
        // Quadro final desenhado UMA vez e o rAF para (WCAG 2.2.2: nada se move depois).
        running = false;
        showFinal();
        return;
      }
    }
    draw();
    raf = requestAnimationFrame(tick);
  };

  const setRunning = (on: boolean) => {
    if (mode === 'formed' || on === running) return;
    running = on;
    if (on && mode === 'sphere') t0 = null;
    if (on) raf = requestAnimationFrame(tick);
    else cancelAnimationFrame(raf);
  };

  measure();
  const stopSize = watchSize(canvas, measure);
  const stopVisible = still ? () => {} : watchVisibility(canvas, setRunning);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    stopSize();
    stopVisible();
  };
}

/**
 * Esfera de pontos que "explode" e se reorganiza no gráfico em alta. Canvas 2D puro.
 * Em telas menores que 768 px (e com movimento reduzido) mostra só o gráfico já formado.
 */
export function HeroParticles({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Começa só quando o navegador estiver ocioso: não disputa a thread principal com o LCP.
    let stop: (() => void) | undefined;
    const cancelIdle = whenIdle(() => {
      stop = startParticles(canvas);
    });
    return () => {
      cancelIdle();
      stop?.();
    };
  }, []);

  return (
    <div className={`relative h-[300px] w-full sm:h-[340px] ${className}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Ilustração: gráfico em alta formado por pontos"
        className="absolute inset-0 block h-full w-full"
      />
    </div>
  );
}
