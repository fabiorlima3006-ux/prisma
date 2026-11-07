import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { config, proxy } from './proxy';

describe('proxy', () => {
  it('maiúsculas: 308 para o caminho em minúsculas, mantendo a query', () => {
    const res = proxy(new NextRequest('http://localhost:3000/acoes/PETR4?a=1'));
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('http://localhost:3000/acoes/petr4?a=1');
  });

  it('minúsculas: segue adiante', () => {
    const res = proxy(new NextRequest('http://localhost:3000/acoes/petr4'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('não cobre rotas de API', () => {
    expect(config.matcher.some((m) => m.startsWith('/api'))).toBe(false);
  });
});
