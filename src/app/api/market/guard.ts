import { z } from 'zod';
import { CATALOG, CLASS_ROUTES } from '@/lib/data/catalog';
import type { Asset } from '@/lib/data/types';
import { log } from '@/lib/logger';
import { apiLimiter, clientIp } from '@/lib/security/rate-limit';

const CACHE_CONTROL = 'public, s-maxage=900, stale-while-revalidate=3600';

const tickerSchema = z.string().regex(/^[A-Za-z0-9^.]{1,12}$/);

export function json(
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return Response.json(body, { status, headers });
}

export function ok(body: unknown): Response {
  return json(body, 200, { 'Cache-Control': CACHE_CONTROL });
}

/** Retorna uma resposta 429 se o IP estourou o limite; senão, null. */
export function limited(req: Request): Response | null {
  const r = apiLimiter.check(clientIp(req));
  if (r.ok) return null;
  return json({ error: 'rate-limited' }, 429, { 'Retry-After': String(r.retryAfterSec) });
}

const CLASSES_WITH_PAGE: ReadonlySet<Asset['class']> = new Set(Object.values(CLASS_ROUTES));

/**
 * Resolve o ticker no catálogo. Só classes com página (ações, FIIs, ETFs, cripto) são servidas:
 * índices e câmbio respondem 404 (o dólar real é o indicador PTAX, nunca uma cotação demo).
 */
export function resolveAsset(raw: string): Asset | 'invalid' | 'not-found' {
  if (!tickerSchema.safeParse(raw).success) return 'invalid';
  const k = raw.toLowerCase();
  const asset = CATALOG.find((a) => a.ticker.toLowerCase() === k || a.slug === k);
  return asset && CLASSES_WITH_PAGE.has(asset.class) ? asset : 'not-found';
}

export function internalError(route: string, err: unknown): Response {
  log('error', 'api-internal-error', {
    route,
    message: err instanceof Error ? err.message : String(err),
  });
  return json({ error: 'internal' }, 500);
}
