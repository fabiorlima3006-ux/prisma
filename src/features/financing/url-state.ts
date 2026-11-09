import { financingInputSchema, type FinancingInput } from '@/lib/finance/financing';
import { parseBrNumber } from '@/lib/format';

export type FormValues = {
  valor: string;
  /** Taxa em % (por mês ou por ano, conforme `periodo`). */
  taxa: string;
  periodo: 'mes' | 'ano';
  prazo: string;
  extra: string;
};

export type FieldName = keyof FormValues;
export type FormErrors = Partial<Record<FieldName | 'form', string>>;

/** Padrões: R$ 300.000, 1% ao mês, 360 meses e sem amortização extra. */
export const DEFAULT_VALUES: FormValues = {
  valor: '300000',
  taxa: '1',
  periodo: 'mes',
  prazo: '360',
  extra: '0',
};

const REQUIRED = 'Informe um número válido';
const FIELD_BY_PATH: Record<string, FieldName> = {
  principal: 'valor',
  rate: 'taxa',
  ratePeriod: 'periodo',
  months: 'prazo',
  extraMonthly: 'extra',
};

export type Validation =
  { input: FinancingInput; errors?: undefined } | { input?: undefined; errors: FormErrors };

export function validateValues(v: FormValues): Validation {
  const valor = parseBrNumber(v.valor);
  const taxa = parseBrNumber(v.taxa);
  const prazo = parseBrNumber(v.prazo);
  const extra = parseBrNumber(v.extra);

  const errors: FormErrors = {};
  if (valor === null) errors.valor = REQUIRED;
  if (taxa === null) errors.taxa = REQUIRED;
  if (prazo === null) errors.prazo = REQUIRED;
  if (extra === null) errors.extra = REQUIRED;
  if (Object.keys(errors).length > 0) return { errors };

  const parsed = financingInputSchema.safeParse({
    principal: valor,
    rate: taxa! / 100,
    ratePeriod: v.periodo === 'ano' ? 'year' : 'month',
    months: prazo,
    extraMonthly: extra,
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

/** URL: ponto decimal, taxa em %. */
export function toSearchParams(input: FinancingInput): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('valor', plainNumber(input.principal));
  sp.set('taxa', plainNumber(input.rate * 100));
  sp.set('periodo', input.ratePeriod === 'year' ? 'ano' : 'mes');
  sp.set('prazo', plainNumber(input.months));
  sp.set('extra', plainNumber(input.extraMonthly));
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
  input: FinancingInput | null;
} {
  const values: FormValues = {
    valor: fieldText(sp.get('valor'), DEFAULT_VALUES.valor),
    taxa: fieldText(sp.get('taxa'), DEFAULT_VALUES.taxa),
    periodo: sp.get('periodo') === 'ano' ? 'ano' : 'mes',
    prazo: fieldText(sp.get('prazo'), DEFAULT_VALUES.prazo),
    extra: fieldText(sp.get('extra'), DEFAULT_VALUES.extra),
  };
  return { values, input: validateValues(values).input ?? null };
}
