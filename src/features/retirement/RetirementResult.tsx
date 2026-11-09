import { AreaChart } from '@/components/charts';
import { Card } from '@/components/ui';
import { retirementPlan, type RetirementInput } from '@/lib/finance/retirement';
import { formatCurrency } from '@/lib/format';

const NOTE =
  'Valores em reais de hoje. Rentabilidade real constante é uma simplificação; IR e custos não estão incluídos; resultados reais variam.';

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

function Message({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-line bg-surface p-4 text-sm text-text">{children}</p>
  );
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function RetirementResult({ input }: { input: RetirementInput | null }) {
  if (!input) {
    return (
      <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        Corrija os campos destacados para ver o resultado da simulação.
      </p>
    );
  }
  const plan = retirementPlan(input);
  const { requiredWealth, monthsToTarget, ageAtTarget, contributionForTargetAge } = plan;

  if (requiredWealth === null) {
    return (
      <div className="space-y-4" aria-live="polite">
        <Message>Com rentabilidade real zero, não é possível viver só dos rendimentos</Message>
        <p className="text-xs text-muted">{NOTE}</p>
      </div>
    );
  }

  // Tempo até a meta: um valor (cartão) ou uma mensagem, nunca os dois.
  let timeValue: string | null = null;
  let timeMessage: string | null = null;
  if (monthsToTarget === null || ageAtTarget === null) {
    timeMessage = 'Com esses valores, o patrimônio necessário não é atingido em 100 anos';
  } else if (monthsToTarget === 0) {
    timeMessage = 'O patrimônio atual já cobre a renda desejada nesta simulação';
  } else if (ageAtTarget.years > 100) {
    timeMessage =
      'Com esses valores, o patrimônio necessário só seria atingido depois dos 100 anos de idade';
  } else {
    const y = Math.floor(monthsToTarget / 12);
    const m = monthsToTarget % 12;
    timeValue = `${plural(y, 'ano', 'anos')} e ${plural(m, 'mês', 'meses')}, aos ${plural(ageAtTarget.years, 'ano', 'anos')} e ${plural(ageAtTarget.months, 'mês', 'meses')} de idade`;
  }

  const showContribution = input.targetAge !== null && monthsToTarget !== 0;
  // "Já cobre" só vale quando a meta já está atingida hoje (monthsToTarget === 0).
  const points = plan.yearly.map((p) => ({ label: `${p.age} anos`, value: p.wealth }));

  return (
    <div className="space-y-4">
      <div aria-live="polite" className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Patrimônio necessário"
            value={formatCurrency(requiredWealth)}
            testId="required-wealth"
          />
          {timeValue !== null && (
            <Stat
              label="Tempo até o patrimônio necessário"
              value={timeValue}
              testId="time-to-target"
            />
          )}
        </div>
        {timeMessage !== null && <Message>{timeMessage}</Message>}
        {showContribution && typeof contributionForTargetAge === 'number' && (
          <Stat
            label="Aporte mensal necessário"
            value={`${formatCurrency(contributionForTargetAge)} por mês até os ${input.targetAge} anos`}
            testId="needed-contribution"
          />
        )}
        {showContribution && contributionForTargetAge === 'already-covered' && (
          <Message>{`Sem novos aportes, o patrimônio atual chegaria ao necessário até os ${input.targetAge} anos nesta simulação.`}</Message>
        )}
        <p className="text-xs text-muted">
          O patrimônio necessário é o valor cujos rendimentos reais pagam a renda desejada sem
          consumir o principal.
        </p>
      </div>
      <AreaChart
        title={`Evolução do patrimônio por idade (patrimônio necessário: ${formatCurrency(requiredWealth)})`}
        description={`Patrimônio necessário: ${formatCurrency(requiredWealth)}.`}
        labelHeader="Idade"
        data={points}
        formatValue={(v) => formatCurrency(v)}
      />
      <p className="text-xs text-muted">{NOTE}</p>
    </div>
  );
}
