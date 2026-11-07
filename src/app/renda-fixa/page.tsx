import type { Metadata } from 'next';
import { Disclaimer } from '@/components/layout/Disclaimer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Renda fixa' };

const TOPICS = [
  {
    title: 'CDB',
    text: 'Certificado de Depósito Bancário: um empréstimo ao banco, que paga uma taxa combinada, prefixada ou atrelada a um índice como o CDI. Rendimentos têm Imposto de Renda regressivo.',
  },
  {
    title: 'Tesouro Direto',
    text: 'Títulos públicos emitidos pelo governo federal. Tesouro Selic, prefixado e IPCA+ reagem de formas diferentes aos juros e à inflação; resgatados antes do vencimento, podem ter valor diferente do esperado.',
  },
  {
    title: 'LCI e LCA',
    text: 'Letras de crédito imobiliário e do agronegócio emitidas por bancos. Para pessoas físicas, os rendimentos costumam ser isentos de Imposto de Renda, e muitas têm carência.',
  },
  {
    title: 'FGC',
    text: 'O Fundo Garantidor de Créditos cobre, dentro de limites por CPF e por instituição, depósitos e alguns títulos bancários como CDB, LCI e LCA. Não cobre o Tesouro Direto, que tem outro tipo de risco.',
  },
];

export default function RendaFixaPage() {
  return (
    <>
      <PageHeader
        eyebrow="renda fixa"
        title="Renda fixa"
        description="Conceitos básicos para entender como funcionam os principais títulos de renda fixa."
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: 'Renda fixa' }]}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {TOPICS.map((t) => (
            <Card as="article" key={t.title}>
              <h2 className="text-base font-bold text-text">{t.title}</h2>
              <p className="mt-1 text-sm leading-relaxed">{t.text}</p>
            </Card>
          ))}
        </div>
        <p className="text-sm">
          Esta área ainda está em construção. Para comparar o resultado de diferentes aplicações em
          uma simulação, ou aprofundar os conceitos, use os links abaixo.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href="/ferramentas/comparador" variant="secondary" size="sm">
            Comparador de investimentos
          </Button>
          <Button href="/educacao" variant="secondary" size="sm">
            Educação financeira
          </Button>
        </div>
        <Disclaimer variant="prominent" />
      </div>
    </>
  );
}
