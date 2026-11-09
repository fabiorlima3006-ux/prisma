const LOCALE = 'pt-BR';

const formatters = new Map<number, Intl.NumberFormat>();

export function formatNumber(value: number, decimals = 2): string {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(decimals, f);
  }
  return f.format(value);
}

/**
 * Interpreta números digitados em formato brasileiro. Retorna null (nunca NaN)
 * quando a entrada é inválida.
 *
 * Regras (após trim):
 * - '-' inicial opcional;
 * - com vírgula: parte inteira com '.' de milhar em grupos de 3 (ou só dígitos)
 *   e parte decimal de 1+ dígitos ("1.000,50", "12,5", "-3,2");
 * - sem vírgula: só dígitos ("1000"); ou milhar com pontos em grupos de 3
 *   ("1.000" → 1000); ou, de forma permissiva, um único '.' seguido de 1 ou 2
 *   dígitos como decimal ("1.5" → 1.5);
 * - qualquer outra coisa → null.
 */
export function parseBrNumber(input: string): number | null {
  const s = input.trim();
  let normalized: string;
  if (/^-?(\d{1,3}(\.\d{3})+|\d+),\d+$/.test(s)) {
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d+$/.test(s)) {
    normalized = s;
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    normalized = s.replace(/\./g, '');
  } else if (/^-?\d+\.\d{1,2}$/.test(s)) {
    normalized = s;
  } else {
    return null;
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
