import { StackedAreaChart } from '@/components/charts';
import { Card } from '@/components/ui';
import {
  compoundInterest,
  yearlySummary,
  type CompoundInterestInput,
} from '@/lib/finance/compound-interest';
import { realRate, toPresentValue } from '@/lib/finance/inflation';
import { formatCurrency, formatPercent } from '@/lib/format';
import { YearlyTable, yearLabel } from './YearlyTable';

function Stat({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <Card>
      <p className="text-xs">{label}</p>
      <p data-testid={testId} className="mt-1 font-mono text-xl font-bold text-text">
        {value}
      </p>
    </Card>
  );
}

/** Valor final em reais de hoje e a taxa real (Fisher) em base anual e mensal equivalente. */
function realEquivalents(input: CompoundInterestInput, finalBalance: number, inflation: number) {
  const nominalAnnual = input.ratePeriod === 'year' ? input.rate : Math.pow(1 + input.rate, 12) - 1;
  const annual = realRate(nominalAnnual, inflation);
  return {
    finalToday: toPresentValue(finalBalance, inflation, input.months / 12),
    annual,
    monthly: Math.pow(1 + annual, 1 / 12) - 1,
  };
}

export function CompoundInterestResult({
  input,
  inflation = null,
}: {
  input: CompoundInterestInput | null;
  /** Premissa de inflação anual (fração). Null: sem a parte em reais de hoje. */
  inflation?: number | null;
}) {
  const result = input ? compoundInterest(input) : null;
  const yearly = result ? yearlySummary(result.rows) : [];
  const real =
    input && result && inflation !== null
      ? realEquivalents(input, result.finalBalance, inflation)
      : null;
  const monthly = (input?.months ?? 0) <= 24;
  const points = (result ? (monthly ? result.rows : yearly) : []).map((r) => ({
    label: monthly ? `Mês ${r.month}` : `Ano ${yearLabel(r.month)}`,
    invested: r.invested,
    interest: r.interest,
  }));

  return (
    <div className="space-y-4">
      <div aria-live="polite">
        {result ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Patrimônio final"
              value={formatCurrency(result.finalBalance)}
              testId="final-balance"
            />
            <Stat
              label="Total investido"
              value={formatCurrency(result.totalInvested)}
              testId="total-invested"
            />
            <Stat
              label="Juros acumulados"
              value={formatCurrency(result.totalInterest)}
              testId="total-interest"
            />
          </div>
        ) : (
          <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
            Corrija os campos destacados para ver o resultado da simulação.
          </p>
        )}
      </div>
      {result && real && (
        <div aria-live="polite" className="space-y-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Valor final em reais de hoje"
              value={formatCurrency(real.finalToday)}
              testId="final-real"
            />
            <Stat
              label="Taxa real equivalente"
              value={`${formatPercent(real.annual, { signed: true })} a.a. (${formatPercent(real.monthly, { signed: true })} a.m.)`}
              testId="real-rate"
            />
          </div>
          <p className="text-xs text-muted">
            Calculado com a inflação de {formatPercent(inflation ?? 0)} a.a. (premissa, não
            previsão). O valor real é uma estimativa: a inflação futura é incerta.
          </p>
        </div>
      )}
      {result && (
        <>
          <StackedAreaChart
            title="Evolução do patrimônio: total investido e juros acumulados"
            data={points}
            formatValue={(v) => formatCurrency(v)}
          />
          <YearlyTable rows={yearly} inflation={inflation} />
        </>
      )}
    </div>
  );
}
