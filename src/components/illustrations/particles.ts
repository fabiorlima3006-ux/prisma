export const PARTICLE_COUNT = 620;
export const CYAN = '#2fd3ff';

/** PRNG determinístico (mulberry32): mesmo layout no SSR, na hidratação e nos testes. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Esfera de Fibonacci: pontos [x, y, z] em torno da origem, raio 1. */
export function fibonacciSphere(n: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = i * 2.399963;
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  return pts;
}

const CHART_X = [0.06, 0.18, 0.28, 0.4, 0.5, 0.62, 0.72, 0.86, 0.95];
const CHART_Y = [0.78, 0.68, 0.72, 0.52, 0.58, 0.36, 0.42, 0.18, 0.24];

/** Gráfico em alta: linha + área pontilhada (1 bit) que perde densidade com a profundidade. */
export function chartPoints(
  w: number,
  h: number,
  n: number,
  rand: () => number,
): [number, number][] {
  const last = CHART_X.length - 1;
  const line = (t: number): [number, number] => {
    const f = t * last;
    const i = Math.min(Math.floor(f), last - 1);
    const k = f - i;
    const x0 = CHART_X[i] ?? 0;
    const x1 = CHART_X[i + 1] ?? x0;
    const y0 = CHART_Y[i] ?? 0;
    const y1 = CHART_Y[i + 1] ?? y0;
    return [(x0 + (x1 - x0) * k) * w, (y0 + (y1 - y0) * k) * h];
  };
  const pts: [number, number][] = [];
  const lineCount = Math.floor(n * 0.45);
  for (let i = 0; i < lineCount; i++) {
    const [x, y] = line(i / lineCount);
    pts.push([x + (rand() - 0.5) * 3, y + (rand() - 0.5) * 3]);
  }
  let guard = 0;
  while (pts.length < n && guard++ < 20000) {
    const [x, y] = line(rand());
    const bottom = h * 0.9;
    const yy = y + rand() * (bottom - y);
    const dens = 1 - (yy - y) / (bottom - y + 1);
    if (rand() < dens * dens) pts.push([Math.round(x / 5) * 5, Math.round(yy / 5) * 5]);
  }
  while (pts.length < n) pts.push(pts[pts.length % Math.max(lineCount, 1)] ?? [w / 2, h / 2]);
  return pts;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Chama onChange(true|false) quando o elemento fica visível (na tela e com a aba ativa).
 * Retorna a função de limpeza.
 */
export function watchVisibility(el: Element, onChange: (visible: boolean) => void): () => void {
  let onScreen = true;
  const emit = () => onChange(onScreen && !document.hidden);
  const io =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          const last = entries.at(-1);
          if (last) {
            onScreen = last.isIntersecting;
            emit();
          }
        });
  io?.observe(el);
  document.addEventListener('visibilitychange', emit);
  emit();
  return () => {
    io?.disconnect();
    document.removeEventListener('visibilitychange', emit);
  };
}

/** Observa o tamanho do elemento (ou a janela, na falta de ResizeObserver). */
export function watchSize(el: Element, onResize: () => void): () => void {
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}

/**
 * Agenda `cb` para quando o navegador estiver ocioso (`requestIdleCallback`, com teto de 1,5 s);
 * sem suporte, usa `setTimeout(cb, 200)`. Retorna a função que cancela o agendamento.
 */
export function whenIdle(cb: () => void): () => void {
  const ric = window.requestIdleCallback;
  const cic = window.cancelIdleCallback;
  if (typeof ric === 'function' && typeof cic === 'function') {
    const id = ric.call(window, cb, { timeout: 1500 });
    return () => cic.call(window, id);
  }
  const t = window.setTimeout(cb, 200);
  return () => window.clearTimeout(t);
}
