import { TAX_RULES, type TaxRules } from '../config/tax-rules';

/** Alíquota de IR regressivo para o prazo em dias corridos (limites superiores inclusivos). */
export function incomeTaxRate(
  holdingDays: number,
  rules: TaxRules['incomeTaxBrackets'] = TAX_RULES.incomeTaxBrackets,
): number {
  const days = Math.max(1, holdingDays);
  const bracket = rules.brackets.find((b) => b.upToDays === null || days <= b.upToDays);
  const last = rules.brackets[rules.brackets.length - 1];
  const found = bracket ?? last;
  if (!found) throw new Error('Tabela de IR sem faixas');
  return found.rate;
}

/** Aproxima dias úteis a partir de dias corridos (252/365). */
export function businessDaysApprox(calendarDays: number): number {
  return Math.round((calendarDays * 252) / 365);
}
