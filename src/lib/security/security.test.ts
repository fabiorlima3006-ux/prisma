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

describe('createRateLimiter: retenção do IP', () => {
  it('remove janelas expiradas na consulta seguinte (o IP não fica além da janela)', () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 5, windowMs: 60_000, now: () => t });
    rl.check('10.0.0.1');
    rl.check('10.0.0.2');
    expect(rl.size()).toBe(2);
    t = 30_000;
    rl.check('10.0.0.3');
    expect(rl.size()).toBe(3);
    t = 60_000;
    rl.check('10.0.0.9');
    // 10.0.0.1 e .2 expiraram (60 s); sobram .3 (30 s) e .9.
    expect(rl.size()).toBe(2);
  });
});

describe('createRateLimiter maxKeys', () => {
  it('nunca passa do teto de chaves', () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 5, windowMs: 1000, maxKeys: 3, now: () => t });
    for (let i = 0; i < 20; i++) {
      rl.check(`ip${i}`);
      expect(rl.size()).toBeLessThanOrEqual(3);
    }
    // despeja as mais antigas: ip0 foi removida e começa de novo
    expect(rl.size()).toBe(3);
    t = 5000;
    rl.check('novo');
    expect(rl.size()).toBe(1);
  });
});

describe('clientIp', () => {
  const ip = (h: Record<string, string>) => clientIp(new Request('http://x', { headers: h }));
  it('prefere x-real-ip', () => {
    expect(ip({ 'x-real-ip': ' 9.9.9.9 ', 'x-forwarded-for': '1.2.3.4' })).toBe('9.9.9.9');
  });
  it('senão usa o primeiro x-forwarded-for, sem espaços', () => {
    expect(ip({ 'x-forwarded-for': ' 1.2.3.4 , 5.6.7.8' })).toBe('1.2.3.4');
  });
  it('senão unknown', () => {
    expect(ip({})).toBe('unknown');
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
    expect(get('Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains');
    expect(get('Strict-Transport-Security')).not.toContain('preload');
  });
  it('só usa unsafe-eval fora de produção', () => {
    expect(process.env.NODE_ENV).not.toBe('production');
    expect(get('Content-Security-Policy')).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    );
  });
});
