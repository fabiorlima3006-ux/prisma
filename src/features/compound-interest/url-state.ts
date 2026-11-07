import {
  compoundInterestInputSchema,
  type CompoundInterestInput,
} from '@/lib/finance/compound-interest';
import { parseBrNumber } from '@/lib/format';

export type FormValues = {
  capital: string;
  aporte: string;
  taxa: string;
  periodo: 'mes' | 'ano';
  prazo: string;
  unidade: 'meses' | 'anos';
};

export type FieldName = 'capital' | 'aporte' | 'taxa' | 'prazo';
export type FormErrors = Partial<Record<FieldName | 'form', string>>;

/** Padrões quando a URL não traz parâmetros: R$ 1.000 + R$ 100/mês a 1% a.m. por 12 meses. */
export const DEFAULT_VALUES: FormValues = {
  capital: '1000',
  aporte: '100',
  taxa: '1',
  periodo: 'mes',
  prazo: '12',
  unidade: 'meses',
};

const REQUIRED = 'Informe um número válido';
const FIELD_BY_PATH: Record<string, FieldName> = {
  initial: 'capital',
  monthlyContribution: 'aporte',
  rate: 'taxa',
  months: 'prazo',
};

export type Validation =
  { input: CompoundInterestInput; errors?: undefined } | { input?: undefined; errors: FormErrors };

/** Valida o formulário: taxa em % (÷100 antes do schema), prazo em anos × 12. */
export function validateValues(v: FormValues): Validation {
  const capital = parseBrNumber(v.capital);
  const aporte = parseBrNumber(v.aporte);
  const taxa = parseBrNumber(v.taxa);
  const prazo = parseBrNumber(v.prazo);

  const errors: FormErrors = {};
  if (capital === null) errors.capital = REQUIRED;
  if (aporte === null) errors.aporte = REQUIRED;
  if (taxa === null) errors.taxa = REQUIRED;
  if (prazo === null) errors.prazo = REQUIRED;
  if (capital === null || aporte === null || taxa === null || prazo === null) return { errors };

  const parsed = compoundInterestInputSchema.safeParse({
    initial: capital,
    monthlyContribution: aporte,
    rate: taxa / 100,
    ratePeriod: v.periodo === 'ano' ? 'year' : 'month',
    months: v.unidade === 'anos' ? Math.round(prazo * 12 * 1e6) / 1e6 : prazo,
  });
  if (parsed.success) return { input: parsed.data };

  for (const issue of parsed.error.issues) {
    const key = FIELD_BY_PATH[String(issue.path[0] ?? '')] ?? 'form';
    errors[key] ??= issue.message;
  }
  return { errors };
}

/** Número em notação decimal simples (nunca exponencial), aceito por /^-?\d+(\.\d+)?$/. */
function plainNumber(n: number): string {
  const rounded = Number(n.toPrecision(12));
  const text = String(rounded);
  if (!text.includes('e')) return text;
  return rounded.toFixed(15).replace(/0+$/, '').replace(/\.$/, '');
}

function numberParam(n: number): string {
  return plainNumber(n);
}

/** Escreve a URL: números com ponto decimal, taxa em %, prazo em anos quando múltiplo de 12. */
export function toSearchParams(
  input: CompoundInterestInput,
  unit: 'meses' | 'anos' = input.months % 12 === 0 ? 'anos' : 'meses',
): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('capital', numberParam(input.initial));
  sp.set('aporte', numberParam(input.monthlyContribution));
  sp.set('taxa', numberParam(input.rate * 100));
  sp.set('periodo', input.ratePeriod === 'year' ? 'ano' : 'mes');
  sp.set('prazo', numberParam(unit === 'anos' ? input.months / 12 : input.months));
  sp.set('unidade', unit);
  return sp;
}

/** Parâmetros da URL são sempre ponto-decimal ("1.000" = 1). Inválido: mantém o texto para o campo acusar o erro. */
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
  input: CompoundInterestInput | null;
} {
  const periodo = sp.get('periodo');
  const unidade = sp.get('unidade');
  const values: FormValues = {
    capital: fieldText(sp.get('capital'), DEFAULT_VALUES.capital),
    aporte: fieldText(sp.get('aporte'), DEFAULT_VALUES.aporte),
    taxa: fieldText(sp.get('taxa'), DEFAULT_VALUES.taxa),
    periodo: periodo === 'ano' || periodo === 'mes' ? periodo : DEFAULT_VALUES.periodo,
    prazo: fieldText(sp.get('prazo'), DEFAULT_VALUES.prazo),
    unidade: unidade === 'anos' || unidade === 'meses' ? unidade : DEFAULT_VALUES.unidade,
  };
  return { values, input: validateValues(values).input ?? null };
}
