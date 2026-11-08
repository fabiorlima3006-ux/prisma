'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tabs } from '@/components/ui';
import type { DataResult, MonthlyPoint } from '@/lib/data/types';
import { CorrectionPanel, type ParsedCorrection } from './CorrectionPanel';
import { evaluateFuture, PurchasingPowerForm } from './PurchasingPowerForm';
import {
  toSearchParams,
  type CorrectionValues,
  type FutureValues,
  type InflationTab,
} from './url-state';

const DEBOUNCE_MS = 300;

export function InflationSimulator({
  history,
  initialTab,
  correction,
  future: initialFuture,
  inflationNote,
}: {
  /** Série do IPCA mensal (BCB), transmitida pelo servidor sem bloquear a página. */
  history: Promise<DataResult<MonthlyPoint[]>>;
  initialTab: InflationTab;
  correction: CorrectionValues;
  future: FutureValues;
  inflationNote: string;
}) {
  const [tab, setTab] = useState<InflationTab>(initialTab);
  const [future, setFuture] = useState(initialFuture);
  const [parsedCorrection, setParsedCorrection] = useState<ParsedCorrection | null>(null);
  const onParsed = useCallback((p: ParsedCorrection | null) => setParsedCorrection(p), []);

  const query = useMemo(() => {
    if (tab === 'corrigir') {
      return parsedCorrection ? toSearchParams('corrigir', parsedCorrection).toString() : null;
    }
    const parsed = evaluateFuture(future).parsed;
    return parsed
      ? toSearchParams('futuro', {
          valor: parsed.valor,
          anos: parsed.anos,
          inflation: parsed.inflation,
        }).toString()
      : null;
  }, [tab, parsedCorrection, future]);

  // O estado inicial já está na URL (ou é o padrão): a primeira consulta da aba inicial só serve
  // de referência. Depois, a URL é reescrita sem navegação (history.replaceState): o Server
  // Component não é executado de novo, então a BCB não é consultada a cada edição.
  const lastQuery = useRef<string | null>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (query === null) return;
    if (!seeded.current && tab === initialTab) {
      seeded.current = true;
      lastQuery.current = query;
      return;
    }
    if (query === lastQuery.current) return;
    const handle = setTimeout(() => {
      lastQuery.current = query;
      window.history.replaceState(null, '', `?${query}`);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, tab, initialTab]);

  return (
    <Tabs
      initialId={initialTab}
      onChange={(id) => setTab(id === 'futuro' ? 'futuro' : 'corrigir')}
      items={[
        {
          id: 'corrigir',
          label: 'Corrigir um valor',
          content: (
            <Suspense
              fallback={
                <p
                  role="status"
                  className="rounded-xl border border-line bg-surface p-4 text-muted"
                >
                  Carregando dados do IPCA…
                </p>
              }
            >
              <CorrectionPanel history={history} initial={correction} onParsed={onParsed} />
            </Suspense>
          ),
        },
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
