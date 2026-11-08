import { ROUTES } from './routes';

const BASE = 'http://localhost:3000';

/**
 * Aquece o servidor de produção antes dos testes. Com o BCB inacessível, a primeira
 * renderização de cada página é lenta (tentativas de conexão); sem o aquecimento, os
 * primeiros testes paralelos estouram o timeout só por causa do arranque a frio.
 *
 * Logo após o `next build` a máquina fica ocupada por um tempo (gravação do cache e do
 * `.next`, indexadores e watchers de arquivos) e o servidor deixa conexões sem resposta por
 * 10-20 s, o que estourava os primeiros testes de cada worker. Por isso, depois de aquecer as
 * rotas, espera o servidor responder rápido várias vezes seguidas antes de liberar os testes.
 */
export default async function globalSetup() {
  for (const route of ROUTES) await timed(route, 60_000);
  const deadline = Date.now() + 180_000;
  let fast = 0;
  while (fast < 8 && Date.now() < deadline) {
    fast = (await timed('/', 30_000)) < 300 ? fast + 1 : 0;
    await new Promise((r) => setTimeout(r, 500));
  }
}

/** Pede a rota e devolve quantos ms levou (falhas contam como o tempo limite). */
async function timed(route: string, timeoutMs: number): Promise<number> {
  const start = Date.now();
  try {
    const res = await fetch(BASE + route, { signal: AbortSignal.timeout(timeoutMs) });
    await res.arrayBuffer();
  } catch {
    // o teste da rota reporta a falha real
    return timeoutMs;
  }
  return Date.now() - start;
}
