import { formatPercent } from '@/lib/format';
import { UNAVAILABLE_TEXT } from './unavailable';

export function PriceChange({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-muted">{UNAVAILABLE_TEXT}</span>;
  }
  const text = formatPercent(value, { signed: true });
  // formatPercent remove o sinal de valores que arredondam para zero.
  const dir = text.startsWith('+') ? 'up' : text.startsWith('-') ? 'down' : 'flat';
  if (dir === 'flat') {
    return <span className="font-mono text-muted">{text}</span>;
  }
  return (
    <span className={`font-mono font-semibold ${dir === 'up' ? 'text-up' : 'text-down'}`}>
      <span aria-hidden="true">
        {dir === 'up' ? '▲ ' : '▼ '}
        {text}
      </span>
      <span className="sr-only">
        {dir === 'up' ? 'alta' : 'queda'} de {formatPercent(Math.abs(value))}
      </span>
    </span>
  );
}
