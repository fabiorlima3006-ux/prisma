'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataSourceBadge } from '@/components/market/DataSourceBadge';
import { Tabs } from '@/components/ui';
import type { DataMeta, MonthlyPoint } from '@/lib/data/types';
import { CorrectionForm, evaluateCorrection } from './CorrectionForm';
import { evaluateFuture, PurchasingPowerForm } from './PurchasingPowerForm';
import {
  toSearchParams,
  type CorrectionValues,
  type FutureValues,
  type InflationTab,
} from './url-state';

const DEBOUNCE_MS = 300;

export function InflationSimulator({
  series,
  meta,
  initialTab,
  correction: initialCorrection,
  future: initialFuture,
  inflationNote,
}: {
  /** Série do IPCA mensal (BCB); null quando indisponível. */
  series: MonthlyPoint[] | null;
  meta: DataMeta | null;
  initialTab: InflationTab;
  correction: CorrectionValues;
  future: FutureValues;
  inflationNote: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<InflationTab>(initialTab);
  const [correction, setCorrection] = useState(initialCorrection);
  const [future, setFuture] = useState(initialFuture);

  const query = useMemo(() => {
    if (tab === 'corrigir') {
      const parsed = series ? evaluateCorrection(series, correction).parsed : undefined;
      return parsed ? toSearchParams('corrigir', parsed).toString() : null;
    }
    const parsed = evaluateFuture(future).parsed;
    return parsed
      ? toSearchParams('futuro', {
          valor: parsed.valor,
          anos: parsed.anos,
          inflation: parsed.inflation,
        }).toString()
      : null;
  }, [tab, series, correction, future]);

  // Estado inicial já está na URL (ou é o padrão): não navega ao montar.
  const lastQuery = useRef<string | null | undefined>(undefined);
  if (lastQuery.current === undefined) lastQuery.current = query;

  useEffect(() => {
    if (query === null || query === lastQuery.current) return;
    const handle = setTimeout(() => {
      lastQuery.current = query;
      router.replace(`?${query}`, { scroll: false });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, router]);

  const correctionContent = series ? (
    <div className="space-y-4">
      <CorrectionForm series={series} values={correction} onChange={setCorrection} />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        {meta && (
          <DataSourceBadge meta={{ ...meta, attribution: 'Banco Central do Brasil — SGS 433' }} />
        )}
        <span>IPCA mensal (IBGE), série histórica desde 07/1994.</span>
      </div>
    </div>
  ) : (
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

  return (
    <Tabs
      initialId={initialTab}
      onChange={(id) => setTab(id === 'futuro' ? 'futuro' : 'corrigir')}
      items={[
        { id: 'corrigir', label: 'Corrigir um valor', content: correctionContent },
        {
          id: 'futuro',
          label: 'Poder de compra no futuro',
          content: (
            <PurchasingPowerForm
              values={future}
              inflationNote={inflationNote}
              onChange={setFuture}
            />
          ),
        },
      ]}
    />
  );
}
