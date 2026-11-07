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

function groupInfo(results: StripResult[]): { source: string; badges: DataMeta[] } {
  const oks = results.flatMap((r) => (r.status === 'ok' ? [r.meta] : []));
  if (oks.length === 0) {
    return {
      source: uniqueOr(results.map((r) => (r.status === 'unavailable' ? r.source : 'mixed'))),
      badges: [],
    };
  }
  const source = uniqueOr(oks.map((m) => m.source));
  const badges: DataMeta[] = [];
  const demo = oks.find((m) => m.isDemo);
  if (demo) badges.push(demo);
  const real = oks.filter((m) => !m.isDemo);
  if (real.length > 0) {
    const attribution = [...new Set(real.map((m) => m.attribution))].join(' · ');
    const asOf =
      real
        .map((m) => m.asOf)
        .sort()
        .at(-1) ?? '';
    badges.push({ source: real[0]?.source ?? 'bcb', isDemo: false, asOf, attribution });
  }
  return { source, badges };
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
        const { source, badges } = groupInfo(g.results);
        return (
          <div key={i} data-source-group={source} className="flex flex-col gap-2">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {g.results.map((r, j) => (
                <Item key={j} result={r} label={g.labels[j] ?? ''} />
              ))}
            </ul>
            {badges.map((m, k) => (
              <DataSourceBadge key={k} meta={m} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
