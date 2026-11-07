import { formatCurrency } from '@/lib/format';
import { UNAVAILABLE_TEXT } from './unavailable';

export function RangeBar({
  low,
  high,
  current,
  label,
}: {
  low: number | null;
  high: number | null;
  current: number | null;
  label: string;
}) {
  if (low === null || high === null || current === null) {
    return (
      <div className="text-xs text-muted">
        <span>{label}: </span>
        <span>{UNAVAILABLE_TEXT}</span>
      </div>
    );
  }
  const span = high - low;
  const raw = span > 0 ? ((current - low) / span) * 100 : 50;
  const pos = Math.min(100, Math.max(0, raw));
  return (
    <div className="text-xs text-muted">
      <div className="mb-1">{label}</div>
      <div
        role="img"
        aria-label={`Mínima ${formatCurrency(low)}, máxima ${formatCurrency(high)}, atual ${formatCurrency(current)}`}
        className="relative h-1.5 rounded-full bg-surface-2"
      >
        <span
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent"
          style={{ left: `${pos}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono">
        <span>{formatCurrency(low)}</span>
        <span>{formatCurrency(high)}</span>
      </div>
    </div>
  );
}
