import { z } from 'zod';
import { formatMonthYear } from '@/lib/format';

export type InflationTab = 'corrigir' | 'futuro';

/** Campos do formulário Corrigir, já com os padrões aplicados. */
export type CorrectionFields = { valor: string; de: string; ate: string };

/** `de`/`ate` null: não vieram na URL; o padrão depende da série (ver `defaultPeriod`). */
export type CorrectionValues = { valor: string; de: string | null; ate: string | null };
export type FutureValues = { valor: string; anos: string; inflacao: string };

/** 'MM/aaaa' → 'YYYY-MM'; null se o formato ou o mês forem inválidos. */
export function parseMonthYear(text: string): string | null {
  const match = /^(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;
  return `${match[2]}-${match[1]}`;
}

/** 'YYYY-MM' → 'MM/aaaa'. */
export function monthLabel(month: string): string {
  return formatMonthYear(`${month}-01T12:00:00Z`);
}

/** Padrão do período: de 10 anos antes do último mês da série até o último mês (MM/aaaa). */
export function defaultPeriod(lastMonth: string): { de: string; ate: string } {
  const [year = '', month = ''] = lastMonth.split('-');
  return { de: monthLabel(`${Number(year) - 10}-${month}`), ate: monthLabel(lastMonth) };
}

const tabSchema = z.enum(['corrigir', 'futuro']).catch('corrigir');

/** Número em notação decimal simples (nunca exponencial). */
function plainNumber(n: number): string {
  const rounded = Number(n.toPrecision(12));
  const text = String(rounded);
  if (!text.includes('e')) return text;
  return rounded.toFixed(15).replace(/0+$/, '').replace(/\.$/, '');
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

export function fromSearchParams(
  sp: URLSearchParams,
  opts: { defaultInflacao: string },
): { tab: InflationTab; correction: CorrectionValues; future: FutureValues } {
  const tab: InflationTab = tabSchema.parse(sp.get('aba') ?? undefined);
  // `valor` é o mesmo nome nas duas abas; só a aba ativa é escrita na URL, então ao ler
  // o valor vale para a aba indicada e a outra fica no padrão.
  const valor = fieldText(sp.get('valor'), '1000');
  return {
    tab,
    correction: {
      valor: tab === 'corrigir' ? valor : '1000',
      de: sp.get('de')?.trim() ?? null,
      ate: sp.get('ate')?.trim() ?? null,
    },
    future: {
      valor: tab === 'futuro' ? valor : '1000',
      anos: fieldText(sp.get('anos'), '10'),
      inflacao: fieldText(sp.get('inflacao'), opts.defaultInflacao),
    },
  };
}

/** Escreve só os parâmetros da aba ativa; números com ponto decimal. */
export function toSearchParams(
  tab: InflationTab,
  parts: {
    valor: number;
    de?: string;
    ate?: string;
    anos?: number;
    /** Fração; null grava `inflacao=` (desligada); undefined não grava o parâmetro. */
    inflation?: number | null;
  },
): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('aba', tab);
  sp.set('valor', plainNumber(parts.valor));
  if (tab === 'corrigir') {
    if (parts.de) sp.set('de', parts.de);
    if (parts.ate) sp.set('ate', parts.ate);
  } else {
    if (parts.anos !== undefined) sp.set('anos', plainNumber(parts.anos));
    if (parts.inflation !== undefined)
      sp.set('inflacao', parts.inflation === null ? '' : plainNumber(parts.inflation * 100));
  }
  return sp;
}
