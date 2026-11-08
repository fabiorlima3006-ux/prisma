import { z } from 'zod';

// O Zod 4 testa `Function('')` para ativar o modo JIT; com a CSP sem 'unsafe-eval' isso gera
// uma violação (capturada, mas registrada pelo navegador e pelo Lighthouse). Sem JIT o
// comportamento é idêntico, só um pouco mais lento, o que é irrelevante nestes formulários.
z.config({ jitless: true });
