import {
  compoundInterestInputSchema,
  type CompoundInterestInput,
} from '@/lib/finance/compound-interest';
import { parseInflation } from '@/features/simulators-shared/inflation-input';
import { parseBrNumber } from '@/lib/format';

export type FormValues = {
  capital: string;
  aporte: string;
  taxa: string;
  periodo: 'mes' | 'ano';
  prazo: string;
  unidade: 'meses' | 'anos';
  /** Premissa de inflação em % a.a. (texto pt-BR). Vazio desliga a parte em reais de hoje. */
  inflacao: string;
};

export type FieldName = 'capital' | 'aporte' | 'taxa' | 'prazo' | 'inflacao';
export type FormErrors = Partial<Record<FieldName | 'form', string>>;

/** Padrões quando a URL não traz parâmetros: R$ 1.000 + R$ 100/mês a 1% a.m. por 12 meses. */
export const DEFAULT_VALUES: FormValues = {
  capital: '1000',
  aporte: '100',
  taxa: '1',
  periodo: 'mes',
  prazo: '12',
  unidade: 'meses',
  inflacao: '',
};

const REQUIRED = 'Informe um número válido';
const FIELD_BY_PATH: Record<string, FieldName> = {
  initial: 'capital',
  monthlyContribution: 'aporte',
  rate: 'taxa',
  months: 'prazo',
};

export type FormNotes = Partial<Record<'prazo', string>>;

export type Validation = (
  | { input: CompoundInterestInput; errors?: undefined; notes: FormNotes }
  | { input?: undefined; errors: FormErrors; notes: FormNotes }
) & {
  /** Inflação anual em fração; null quando vazia ou inválida. */
  inflation: number | null;
  /** Erro do campo de inflação (não impede o cálculo nominal). */
  inflationError?: string;
};

/**
 * Valida o formulário: taxa em % (÷100 antes do schema), prazo em anos × 12 arredondado para
 * meses inteiros (com nota "convertido para N meses" quando o arredondamento muda o valor).
 */
export function validateValues(v: FormValues): Validation {
  const infl = parseInflation(v.inflacao);
  const capital = parseBrNumber(v.capital);
  const aporte = parseBrNumber(v.aporte);
  const taxa = parseBrNumber(v.taxa);
  const prazo = parseBrNumber(v.prazo);

  const errors: FormErrors = {};
  if (capital === null) errors.capital = REQUIRED;
  if (aporte === null) errors.aporte = REQUIRED;
  if (taxa === null) errors.taxa = REQUIRED;
  if (prazo === null) errors.prazo = REQUIRED;
  if (capital === null || aporte === null || taxa === null || prazo === null) {
    return { errors, notes: {}, ...infl };
  }

  const notes: FormNotes = {};
  let months = prazo;
  if (v.unidade === 'anos') {
    const exact = prazo * 12;
    months = Math.round(exact);
    if (Math.abs(exact - months) > 1e-9 && months >= 1)
      notes.prazo = `convertido para ${months} meses`;
  }

  const parsed = compoundInterestInputSchema.safeParse({
    initial: capital,
    monthlyContribution: aporte,
    rate: taxa / 100,
    ratePeriod: v.periodo === 'ano' ? 'year' : 'month',
    months,
  });
  if (parsed.success) return { input: parsed.data, notes, ...infl };

  for (const issue of parsed.error.issues) {
    const key = FIELD_BY_PATH[String(issue.path[0] ?? '')] ?? 'form';
    errors[key] ??= issue.message;
  }
  return { errors, notes, ...infl };
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

/**
 * Escreve a URL: números com ponto decimal, taxa em %, prazo em anos só quando múltiplo de 12
 * (um prazo em anos convertido, como 1,3 anos → 16 meses, vai para a URL em meses).
 * `inflation` (fração): número → `inflacao` em %; null → `inflacao=` vazio (desligada);
 * undefined → o parâmetro não é escrito.
 */
export function toSearchParams(
  input: CompoundInterestInput,
  preferred: 'meses' | 'anos' = 'anos',
  inflation?: number | null,
): URLSearchParams {
  const unit = preferred === 'anos' && input.months % 12 === 0 ? 'anos' : 'meses';
  const sp = new URLSearchParams();
  sp.set('capital', numberParam(input.initial));
  sp.set('aporte', numberParam(input.monthlyContribution));
  sp.set('taxa', numberParam(input.rate * 100));
  sp.set('periodo', input.ratePeriod === 'year' ? 'ano' : 'mes');
  sp.set('prazo', numberParam(unit === 'anos' ? input.months / 12 : input.months));
  sp.set('unidade', unit);
  if (inflation !== undefined)
    sp.set('inflacao', inflation === null ? '' : numberParam(inflation * 100));
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

/**
 * `defaultInflacao` (ex.: "4,58") vale só quando o parâmetro `inflacao` está ausente; `inflacao=`
 * vazio na URL desliga a parte em reais de hoje.
 */
export function fromSearchParams(
  sp: URLSearchParams,
  defaultInflacao = DEFAULT_VALUES.inflacao,
): {
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
    inflacao: fieldText(sp.get('inflacao'), defaultInflacao),
  };
  return { values, input: validateValues(values).input ?? null };
}
