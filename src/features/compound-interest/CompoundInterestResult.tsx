import { StackedAreaChart } from '@/components/charts';
import { Card } from '@/components/ui';
import {
  compoundInterest,
  yearlySummary,
  type CompoundInterestInput,
} from '@/lib/finance/compound-interest';
import { formatCurrency } from '@/lib/format';
import { YearlyTable } from './YearlyTable';

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

export function CompoundInterestResult({ input }: { input: CompoundInterestInput }) {
  const result = compoundInterest(input);
  const yearly = yearlySummary(result.rows);
  const monthly = input.months <= 24;
  const points = (monthly ? result.rows : yearly).map((r) => ({
    label: monthly ? `Mês ${r.month}` : `Ano ${Math.round((r.month / 12) * 10) / 10}`,
    invested: r.invested,
    interest: r.interest,
  }));

  return (
    <div className="space-y-4">
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
      <StackedAreaChart
        title="Evolução do patrimônio: total investido e juros acumulados"
        data={points}
        formatValue={(v) => formatCurrency(v)}
      />
      <YearlyTable rows={yearly} />
    </div>
  );
}
