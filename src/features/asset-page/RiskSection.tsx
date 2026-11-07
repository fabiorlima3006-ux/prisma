import { Card } from '@/components/ui';
import { RISK_TEXTS } from './risk-texts';

export function RiskSection({ assetClass }: { assetClass: keyof typeof RISK_TEXTS }) {
  return (
    <section aria-labelledby="riscos-titulo" className="space-y-3">
      <h2 id="riscos-titulo" className="text-xl font-extrabold text-text">
        Riscos desta classe de ativo
      </h2>
      <Card>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          {RISK_TEXTS[assetClass].map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs">
          Texto educativo sobre a classe em geral; não descreve nenhum ativo específico.
        </p>
      </Card>
    </section>
  );
}
