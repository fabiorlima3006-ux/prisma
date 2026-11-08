import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

/** IP aleatório (faixa TEST-NET-2) por teste e por execução: o limitador em memória não vaza entre reruns. */
function uniqueIp(): string {
  const b = Buffer.from(randomUUID().replace(/-/g, ''), 'hex');
  return `198.51.${b[0] ?? 0}.${1 + ((b[1] ?? 0) % 254)}`;
}

test('cabeçalhos de segurança em /', async ({ request }) => {
  const res = await request.get('/');
  const h = res.headers();
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['x-content-type-options']).toBeTruthy();
  expect(h['referrer-policy']).toBeTruthy();
});

test('ticker malformado na API retorna 400', async ({ request }) => {
  const res = await request.get('/api/market/quote/%3Cscript%3E', {
    headers: { 'x-real-ip': uniqueIp() },
  });
  expect(res.status()).toBe(400);
});

test('ticker desconhecido na API retorna 404', async ({ request }) => {
  const res = await request.get('/api/market/quote/zzzz9', {
    headers: { 'x-real-ip': uniqueIp() },
  });
  expect(res.status()).toBe(404);
});

test('a 61ª requisição seguida retorna 429', async ({ request }) => {
  const ip = uniqueIp();
  const statuses: number[] = [];
  for (let i = 0; i < 61; i++) {
    const res = await request.get('/api/market/indicators', { headers: { 'x-real-ip': ip } });
    statuses.push(res.status());
  }
  expect(statuses.slice(0, 60).every((s) => s !== 429)).toBe(true);
  expect(statuses[60]).toBe(429);
});
