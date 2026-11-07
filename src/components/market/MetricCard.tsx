import type { ReactNode } from 'react';
import { Card, Tooltip } from '@/components/ui';
import type { DataResult } from '@/lib/data/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { UNAVAILABLE_TEXT, unavailableText } from './unavailable';

type MetricFormat = 'percent' | 'ratio' | 'currency' | 'number';
type MetricResult = DataResult<number | null> | { status: 'not-applicable'; reason: string };

function formatValue(v: number, format: MetricFormat): string {
  switch (format) {
    case 'percent':
      return formatPercent(v);
    case 'ratio':
      return `${formatNumber(v, 2)}x`;
    case 'currency':
      return formatCurrency(v);
    default:
      return formatNumber(v);
  }
}

const infoButton =
  'inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-bold';

export function MetricCard({
  label,
  result,
  format,
  help,
}: {
  label: string;
  result: MetricResult;
  format: MetricFormat;
  help?: { text: string; href?: string };
}) {
  let body: ReactNode;
  if (result.status === 'not-applicable') {
    body = (
      <span className="inline-flex items-center gap-1.5 text-base text-muted">
        Não se aplica
        <Tooltip content={result.reason}>
          <button type="button" aria-label="Por que não se aplica?" className={infoButton}>
            i
          </button>
        </Tooltip>
      </span>
    );
  } else if (result.status === 'unavailable') {
    body = <span className="text-sm text-muted">{unavailableText(result.reason)}</span>;
  } else if (result.data === null) {
    body = <span className="text-sm text-muted">{UNAVAILABLE_TEXT}</span>;
  } else {
    body = (
      <span
        className="font-mono text-xl font-bold text-text"
        {...(result.meta.isDemo ? { 'data-demo-value': '' } : {})}
      >
        {formatValue(result.data, format)}
      </span>
    );
  }
  return (
    <Card as="article">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
        <span>{label}</span>
        {help && (
          <Tooltip
            content={
              <>
                {help.text}
                {help.href && (
                  <>
                    {' '}
                    <a href={help.href} className="underline">
                      Saiba mais
                    </a>
                  </>
                )}
              </>
            }
          >
            <button type="button" aria-label={`Sobre ${label}`} className={infoButton}>
              ?
            </button>
          </Tooltip>
        )}
      </div>
      <div>{body}</div>
    </Card>
  );
}
