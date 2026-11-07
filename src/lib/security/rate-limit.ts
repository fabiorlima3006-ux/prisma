export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

/** Janela fixa por chave, em memória. Cada instância do servidor tem o seu contador. */
export function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const now = opts.now ?? Date.now;
  const buckets = new Map<string, { start: number; count: number }>();

  return {
    check(key) {
      const t = now();
      const b = buckets.get(key);
      if (!b || t - b.start >= opts.windowMs) {
        // Limpeza oportunista, para o mapa não crescer sem limite.
        if (buckets.size > 10_000) {
          for (const [k, v] of buckets) if (t - v.start >= opts.windowMs) buckets.delete(k);
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
  const first = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return first || 'unknown';
}

/** Limitador único (60 requisições por minuto por IP) compartilhado por todas as rotas /api/market. */
export const apiLimiter: RateLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
