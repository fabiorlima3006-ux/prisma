import type { ReactNode } from 'react';
import type { DataMeta, DataResult, IndicatorValue, Quote } from '@/lib/data/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { DataSourceBadge } from './DataSourceBadge';
import { PriceChange } from './PriceChange';
import { unavailableText } from './unavailable';

type StripResult = DataResult<IndicatorValue | Quote>;
export type IndicatorGroup = { results: StripResult[]; labels: string[] };

function isIndicator(d: IndicatorValue | Quote): d is IndicatorValue {
  return 'unit' in d;
}

function uniqueOr(values: string[]): string {
  const set = new Set(values);
  return set.size === 1 ? (values[0] ?? 'mixed') : 'mixed';
}

function groupInfo(results: StripResult[]): { source: string; badge: DataMeta | null } {
  const oks = results.flatMap((r) => (r.status === 'ok' ? [r.meta] : []));
  if (oks.length === 0) {
    return {
      source: uniqueOr(results.map((r) => (r.status === 'unavailable' ? r.source : 'mixed'))),
      badge: null,
    };
  }
  const source = uniqueOr(oks.map((m) => m.source));
  const demo = oks.find((m) => m.isDemo);
  if (demo) return { source, badge: demo };
  const attribution = [...new Set(oks.map((m) => m.attribution))].join(' · ');
  const asOf =
    oks
      .map((m) => m.asOf)
      .sort()
      .at(-1) ?? '';
  return { source, badge: { source: oks[0]?.source ?? 'bcb', isDemo: false, asOf, attribution } };
}

function Item({ result, label }: { result: StripResult; label: string }) {
  let value: ReactNode;
  if (result.status === 'unavailable') {
    value = <span className="text-xs text-muted">{unavailableText(result.reason)}</span>;
  } else {
    const d = result.data;
    const demoAttr = result.meta.isDemo ? { 'data-demo-value': '' } : {};
    if (isIndicator(d)) {
      const text =
        d.unit === 'BRL' ? formatCurrency(d.value) : `${formatPercent(d.value)} ${d.unit}`;
      value = (
        <span className="font-mono text-sm font-bold text-text" {...demoAttr}>
          {text}
        </span>
      );
    } else {
      value = (
        <span className="text-sm" {...demoAttr}>
          <PriceChange value={d.change.day} />
        </span>
      );
    }
  }
  return (
    <li className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted">{label}</span>
      {value}
    </li>
  );
}

export function IndicatorStrip({ groups }: { groups: IndicatorGroup[] }) {
  return (
    <div className="flex flex-wrap gap-4 rounded-xl border border-line bg-glass p-3 backdrop-blur">
      {groups.map((g, i) => {
        const { source, badge } = groupInfo(g.results);
        return (
          <div key={i} data-source-group={source} className="flex flex-col gap-2">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {g.results.map((r, j) => (
                <Item key={j} result={r} label={g.labels[j] ?? ''} />
              ))}
            </ul>
            {badge && <DataSourceBadge meta={badge} />}
          </div>
        );
      })}
    </div>
  );
}
