import { retirementInputSchema, type RetirementInput } from '@/lib/finance/retirement';
import { parseBrNumber } from '@/lib/format';

export type FormValues = {
  idade: string;
  /** Vazio: sem idade-alvo. */
  alvo: string;
  patrimonio: string;
  aporte: string;
  renda: string;
  /** Rentabilidade real em % a.a. (premissa). */
  real: string;
};

export type FieldName = keyof FormValues;
export type FormErrors = Partial<Record<FieldName | 'form', string>>;

/** Padrões: 30 anos, sem alvo, R$ 10.000, R$ 1.000 por mês, R$ 5.000 de renda e 4% real a.a. */
export const DEFAULT_VALUES: FormValues = {
  idade: '30',
  alvo: '',
  patrimonio: '10000',
  aporte: '1000',
  renda: '5000',
  real: '4',
};

const REQUIRED = 'Informe um número válido';
const FIELD_BY_PATH: Record<string, FieldName> = {
  currentAge: 'idade',
  targetAge: 'alvo',
  currentWealth: 'patrimonio',
  monthlyContribution: 'aporte',
  desiredMonthlyIncome: 'renda',
  realAnnualReturn: 'real',
};

export type Validation =
  { input: RetirementInput; errors?: undefined } | { input?: undefined; errors: FormErrors };

export function validateValues(v: FormValues): Validation {
  const idade = parseBrNumber(v.idade);
  const patrimonio = parseBrNumber(v.patrimonio);
  const aporte = parseBrNumber(v.aporte);
  const renda = parseBrNumber(v.renda);
  const real = parseBrNumber(v.real);
  const alvoEmpty = v.alvo.trim() === '';
  const alvo = alvoEmpty ? null : parseBrNumber(v.alvo);

  const errors: FormErrors = {};
  if (idade === null) errors.idade = REQUIRED;
  if (!alvoEmpty && alvo === null) errors.alvo = REQUIRED;
  if (patrimonio === null) errors.patrimonio = REQUIRED;
  if (aporte === null) errors.aporte = REQUIRED;
  if (renda === null) errors.renda = REQUIRED;
  if (real === null) errors.real = REQUIRED;
  if (Object.keys(errors).length > 0) return { errors };

  const parsed = retirementInputSchema.safeParse({
    currentAge: idade,
    targetAge: alvo,
    currentWealth: patrimonio,
    monthlyContribution: aporte,
    desiredMonthlyIncome: renda,
    realAnnualReturn: real! / 100,
  });
  if (parsed.success) return { input: parsed.data };
  for (const issue of parsed.error.issues) {
    const key = FIELD_BY_PATH[String(issue.path[0] ?? '')] ?? 'form';
    errors[key] ??= issue.message;
  }
  return { errors };
}

/** Número em notação decimal simples (nunca exponencial). */
function plainNumber(n: number): string {
  const rounded = Number(n.toPrecision(12));
  const text = String(rounded);
  if (!text.includes('e')) return text;
  return rounded.toFixed(15).replace(/0+$/, '').replace(/\.$/, '');
}

/** URL: ponto decimal, rentabilidade em %; sem alvo o parâmetro não é escrito. */
export function toSearchParams(input: RetirementInput): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('idade', plainNumber(input.currentAge));
  if (input.targetAge !== null) sp.set('alvo', plainNumber(input.targetAge));
  sp.set('patrimonio', plainNumber(input.currentWealth));
  sp.set('aporte', plainNumber(input.monthlyContribution));
  sp.set('renda', plainNumber(input.desiredMonthlyIncome));
  sp.set('real', plainNumber(input.realAnnualReturn * 100));
  return sp;
}

/** Parâmetros da URL são ponto-decimal; inválido mantém o texto para o campo acusar o erro. */
function fieldText(raw: string | null, fallback: string): string {
  if (raw === null) return fallback;
  const s = raw.trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const text = plainNumber(Number(s));
    return text.includes('e') ? s : text.replace('.', ',');
  }
  return s;
}

export function fromSearchParams(sp: URLSearchParams): {
  values: FormValues;
  input: RetirementInput | null;
} {
  const values: FormValues = {
    idade: fieldText(sp.get('idade'), DEFAULT_VALUES.idade),
    alvo: fieldText(sp.get('alvo'), DEFAULT_VALUES.alvo),
    patrimonio: fieldText(sp.get('patrimonio'), DEFAULT_VALUES.patrimonio),
    aporte: fieldText(sp.get('aporte'), DEFAULT_VALUES.aporte),
    renda: fieldText(sp.get('renda'), DEFAULT_VALUES.renda),
    real: fieldText(sp.get('real'), DEFAULT_VALUES.real),
  };
  return { values, input: validateValues(values).input ?? null };
}
