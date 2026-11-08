import { ROUTES } from './routes';

/**
 * Aquece o servidor de produção antes dos testes. Com o BCB inacessível, a primeira
 * renderização de cada página é lenta (tentativas de conexão); sem o aquecimento, os
 * primeiros testes paralelos estouram o timeout só por causa do arranque a frio.
 */
export default async function globalSetup() {
  const base = 'http://localhost:3000';
  for (const route of ROUTES) {
    try {
      const res = await fetch(base + route, { signal: AbortSignal.timeout(60_000) });
      await res.arrayBuffer();
    } catch {
      // o teste da rota reporta a falha real
    }
  }
}
