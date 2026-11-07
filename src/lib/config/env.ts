import 'server-only';
import { z } from 'zod';

export type Env = { BRAPI_TOKEN?: string; BCB_BASE_URL: string };

const schema = z.object({
  BRAPI_TOKEN: z
    .string()
    .optional()
    .transform((v) => {
      const t = v?.trim();
      return t ? t : undefined;
    }),
  BCB_BASE_URL: z
    .string()
    .trim()
    .default('https://api.bcb.gov.br')
    .pipe(z.url())
    .transform((u) => u.replace(/\/+$/, '')),
});

/** Valida as variáveis de ambiente. Nunca registre o resultado em log (contém o token). */
export function parseEnv(raw: Record<string, string | undefined>): Env {
  const parsed = schema.parse({
    BRAPI_TOKEN: raw.BRAPI_TOKEN,
    BCB_BASE_URL: raw.BCB_BASE_URL === '' ? undefined : raw.BCB_BASE_URL,
  });
  return parsed.BRAPI_TOKEN === undefined
    ? { BCB_BASE_URL: parsed.BCB_BASE_URL }
    : { BRAPI_TOKEN: parsed.BRAPI_TOKEN, BCB_BASE_URL: parsed.BCB_BASE_URL };
}

export const env: Env = parseEnv(process.env);
