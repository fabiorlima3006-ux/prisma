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
