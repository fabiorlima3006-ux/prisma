import { INFLATION_MAX, INFLATION_MIN } from '@/lib/finance/inflation';
import { formatNumber, parseBrNumber } from '@/lib/format';

const REQUIRED = 'Informe um número válido';
const INFLATION_RANGE = `Informe uma inflação entre ${formatNumber(INFLATION_MIN * 100, 0)}% e ${formatNumber(INFLATION_MAX * 100, 0)}% a.a.`;

/** Lê a inflação em % (texto pt-BR): vazia → desligada; ilegível ou fora de [−50%, 100%] → erro. */
export function parseInflation(text: string): {
  inflation: number | null;
  inflationError?: string;
} {
  if (text.trim() === '') return { inflation: null };
  const pct = parseBrNumber(text);
  if (pct === null) return { inflation: null, inflationError: REQUIRED };
  const fraction = pct / 100;
  if (fraction < INFLATION_MIN || fraction > INFLATION_MAX)
    return { inflation: null, inflationError: INFLATION_RANGE };
  return { inflation: fraction };
}

/**
 * O que a URL deve gravar em `inflacao` (fração), dado o texto do campo e o padrão do servidor
 * (% pt-BR ou vazio/undefined quando não há IPCA real):
 * - ilegível ou fora do intervalo → undefined (não grava);
 * - igual ao padrão (comparado como número) → undefined: o link usa o IPCA do dia em que for aberto;
 * - campo vazio com padrão disponível → null (grava `inflacao=`, desligado);
 * - campo vazio sem padrão → undefined;
 * - qualquer outro valor → a fração.
 */
export function inflationUrlValue(
  text: string,
  defaultPercent: string | undefined,
): number | null | undefined {
  const { inflation, inflationError } = parseInflation(text);
  if (inflationError) return undefined;
  const fallback = defaultPercent ? parseInflation(defaultPercent).inflation : null;
  if (inflation === null) return fallback === null ? undefined : null;
  if (fallback !== null && Math.abs(inflation - fallback) < 1e-12) return undefined;
  return inflation;
}
