import { cn } from '@/components/ui/cn';

export const DISCLAIMER_TEXT =
  'As informações disponibilizadas nesta plataforma possuem finalidade educacional e informativa. Simulações e análises não constituem recomendação individual de investimento. Rentabilidade passada não garante resultados futuros. Investimentos envolvem riscos.';

export function Disclaimer({ variant = 'prominent' }: { variant?: 'footer' | 'prominent' }) {
  return (
    <p
      className={cn(
        variant === 'footer'
          ? 'text-xs leading-relaxed text-muted'
          : 'rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm leading-relaxed text-text',
      )}
    >
      {DISCLAIMER_TEXT}
    </p>
  );
}
