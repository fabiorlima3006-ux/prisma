import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('aplica o padrão do BCB e deixa o token indefinido', () => {
    const e = parseEnv({});
    expect(e.BCB_BASE_URL).toBe('https://api.bcb.gov.br');
    expect(e.BRAPI_TOKEN).toBeUndefined();
  });
  it('trata token vazio ou só com espaços como ausente', () => {
    expect(parseEnv({ BRAPI_TOKEN: '' }).BRAPI_TOKEN).toBeUndefined();
    expect(parseEnv({ BRAPI_TOKEN: '   ' }).BRAPI_TOKEN).toBeUndefined();
    expect(parseEnv({ BRAPI_TOKEN: ' abc ' }).BRAPI_TOKEN).toBe('abc');
  });
  it('remove a barra final da URL do BCB e rejeita URL inválida', () => {
    expect(parseEnv({ BCB_BASE_URL: 'https://x.test//' }).BCB_BASE_URL).toBe('https://x.test');
    expect(() => parseEnv({ BCB_BASE_URL: 'não é url' })).toThrow();
  });
});
