const TZ = 'America/Sao_Paulo';
const INVALID = 'Data inválida';

const fmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

interface Parts {
  d: string;
  mo: string;
  y: string;
  h: string;
  mi: string;
}

// Data pura ("YYYY-MM-DD") e data/hora sem fuso ("YYYY-MM-DDTHH:mm") são
// relógio/calendário de parede: nenhum deslocamento de fuso é aplicado.
const NAIVE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/;

function parts(iso: string): Parts | null {
  const m = NAIVE.exec(iso.trim());
  if (m) {
    const [, y = '', mo = '', d = '', h = '00', mi = '00'] = m;
    const check = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    if (check.getUTCMonth() !== Number(mo) - 1 || check.getUTCDate() !== Number(d)) return null;
    return { y, mo, d, h, mi };
  }
  // Com 'Z' ou offset: converte sempre para America/Sao_Paulo (igual no servidor e no cliente).
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const get = (t: string) => fmt.formatToParts(date).find((p) => p.type === t)?.value ?? '';
  return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute') };
}

export function formatDate(iso: string): string {
  const p = parts(iso);
  return p ? `${p.d}/${p.mo}/${p.y}` : INVALID;
}

export function formatDateTime(iso: string): string {
  const p = parts(iso);
  return p ? `${p.d}/${p.mo}/${p.y} ${p.h}:${p.mi}` : INVALID;
}

/** Mês de referência ("MM/aaaa"), para séries mensais como o IPCA. */
export function formatMonthYear(iso: string): string {
  const p = parts(iso);
  return p ? `${p.mo}/${p.y}` : INVALID;
}
