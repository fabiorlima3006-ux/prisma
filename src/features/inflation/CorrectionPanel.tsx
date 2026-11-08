'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { DataSourceBadge } from '@/components/market/DataSourceBadge';
import type { DataMeta, DataResult, MonthlyPoint } from '@/lib/data/types';
import { CorrectionForm, evaluateCorrection } from './CorrectionForm';
import { defaultPeriod, type CorrectionFields, type CorrectionValues } from './url-state';

export type ParsedCorrection = { valor: number; de: string; ate: string };

/** Painel "Corrigir": lê a série transmitida pelo servidor (use + Suspense no pai). */
export function CorrectionPanel({
  history,
  initial,
  onParsed,
}: {
  history: Promise<DataResult<MonthlyPoint[]>>;
  initial: CorrectionValues;
  /** Entradas válidas (ou null) a cada mudança, para a URL. */
  onParsed: (parsed: ParsedCorrection | null) => void;
}) {
  const result = use(history);

  if (result.status !== 'ok' || result.data.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <p role="status" className="font-semibold text-text">
          Dado indisponível no momento
        </p>
        <p className="mt-1 text-sm text-muted">
          Não foi possível consultar a série do IPCA no Banco Central. Nenhum valor demonstrativo é
          usado no lugar. A aba de poder de compra segue funcionando com a inflação digitada.
        </p>
      </div>
    );
  }

  return <Loaded series={result.data} meta={result.meta} initial={initial} onParsed={onParsed} />;
}

function Loaded({
  series,
  meta,
  initial,
  onParsed,
}: {
  series: MonthlyPoint[];
  meta: DataMeta;
  initial: CorrectionValues;
  onParsed: (parsed: ParsedCorrection | null) => void;
}) {
  const [values, setValues] = useState<CorrectionFields>(() => {
    const last = series.reduce((max, p) => (p.month > max ? p.month : max), '');
    const period = defaultPeriod(last);
    return { valor: initial.valor, de: initial.de ?? period.de, ate: initial.ate ?? period.ate };
  });
  const parsed = useMemo(() => evaluateCorrection(series, values).parsed ?? null, [series, values]);

  useEffect(() => {
    onParsed(parsed);
  }, [parsed, onParsed]);

  return (
    <div className="space-y-4">
      <CorrectionForm series={series} values={values} onChange={setValues} />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <DataSourceBadge meta={{ ...meta, attribution: 'Banco Central do Brasil — SGS 433' }} />
        <span>IPCA mensal (IBGE), série histórica desde 07/1994.</span>
      </div>
    </div>
  );
}
