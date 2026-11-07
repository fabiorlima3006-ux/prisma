import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS } from './headers';
import { clientIp, createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  it('bloqueia após o limite e libera na nova janela', () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect(rl.check('a').ok).toBe(true);
    expect(rl.check('a').ok).toBe(true);
    expect(rl.check('a')).toMatchObject({ ok: false, retryAfterSec: 1 });
    expect(rl.check('b').ok).toBe(true);
    t = 1000;
    expect(rl.check('a').ok).toBe(true);
  });
});

describe('clientIp', () => {
  it('usa o primeiro x-forwarded-for ou unknown', () => {
    const h = { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' };
    expect(clientIp(new Request('http://x', { headers: h }))).toBe('1.2.3.4');
    expect(clientIp(new Request('http://x'))).toBe('unknown');
  });
});

describe('SECURITY_HEADERS', () => {
  const get = (k: string) => SECURITY_HEADERS.find((h) => h.key === k)?.value;
  it('traz a CSP e os demais cabeçalhos', () => {
    const csp = get('Content-Security-Policy')!;
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(get('X-Content-Type-Options')).toBe('nosniff');
    expect(get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
    expect(get('Strict-Transport-Security')).toContain('max-age=63072000');
  });
  it('só usa unsafe-eval fora de produção', () => {
    expect(process.env.NODE_ENV).not.toBe('production');
    expect(get('Content-Security-Policy')).toContain("'unsafe-eval'");
  });
});
