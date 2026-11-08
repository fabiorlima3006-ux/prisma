export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export interface RateLimiter {
  check(key: string): RateLimitResult;
  /** Quantidade de chaves em memória (para testes e diagnóstico). */
  size(): number;
}

/** Janela fixa por chave, em memória. Cada instância do servidor tem o seu contador. */
export function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  now?: () => number;
  /** Teto de chaves em memória (padrão 10.000). */
  maxKeys?: number;
}): RateLimiter {
  const maxKeys = opts.maxKeys ?? 10_000;
  const now = opts.now ?? Date.now;
  const buckets = new Map<string, { start: number; count: number }>();

  return {
    size: () => buckets.size,
    check(key) {
      const t = now();
      // O Map fica em ordem de início da janela: as expiradas estão no começo. Removê-las a cada
      // consulta garante que um IP não seja mantido além da primeira requisição após a janela
      // (política de privacidade: "descartado na primeira requisição após 1 minuto").
      for (const [k, v] of buckets) {
        if (t - v.start < opts.windowMs) break;
        buckets.delete(k);
      }
      const b = buckets.get(key);
      if (!b || t - b.start >= opts.windowMs) {
        if (b)
          buckets.delete(key); // reinsere no fim, mantendo a ordem de inserção por idade
        else if (buckets.size >= maxKeys) {
          // Teto rígido: primeiro remove as janelas expiradas; se ainda estiver cheio, as mais antigas.
          for (const [k, v] of buckets) if (t - v.start >= opts.windowMs) buckets.delete(k);
          for (const k of buckets.keys()) {
            if (buckets.size < maxKeys) break;
            buckets.delete(k);
          }
        }
        buckets.set(key, { start: t, count: 1 });
        return { ok: true };
      }
      if (b.count < opts.limit) {
        b.count += 1;
        return { ok: true };
      }
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((b.start + opts.windowMs - t) / 1000)),
      };
    },
  };
}

export function clientIp(req: Request): string {
  // x-real-ip é definido pela Vercel; x-forwarded-for pode ser forjado fora de proxies confiáveis.
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  const first = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return first || 'unknown';
}

/** Limitador único (60 requisições por minuto por IP) compartilhado por todas as rotas /api/market. */
export const apiLimiter: RateLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
