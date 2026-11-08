/** Variação entre o último fechamento e o de `back` pregões antes (fração); null sem dado. */
export function pctChange(closes: number[], back: number): number | null {
  const last = closes[closes.length - 1];
  const ref = closes[closes.length - 1 - back];
  if (last === undefined || ref === undefined || ref === 0) return null;
  return last / ref - 1;
}
