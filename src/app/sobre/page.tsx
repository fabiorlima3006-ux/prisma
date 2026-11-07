import type { Metadata } from 'next';
import { LegalPage } from '@/features/legal/LegalPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Sobre',
  description:
    'Um projeto de estudo para acompanhar mercados, aprender sobre investimentos e simular cenários.',
  path: '/sobre',
});

export default function SobrePage() {
  return (
    <LegalPage
      title="Sobre"
      description="Um projeto de estudo para acompanhar mercados, aprender sobre investimentos e simular cenários."
      sections={[
        {
          heading: 'O que é o Prisma',
          body: (
            <p>
              O Prisma é um projeto de estudo e portfólio: uma plataforma para acompanhar mercados,
              entender conceitos de investimento, analisar ativos e simular cenários. Não é uma
              instituição financeira, corretora ou consultoria.
            </p>
          ),
        },
        {
          heading: 'Como tratamos os dados',
          body: (
            <p>
              Taxas e indicadores vêm do Banco Central do Brasil. Cotações de ativos brasileiros
              podem vir da brapi quando há uma chave configurada; sem ela, preços e históricos são
              demonstrativos e aparecem com o selo DADOS DEMONSTRATIVOS. Quando um dado não está
              disponível, dizemos isso em vez de preencher com valores inventados.
            </p>
          ),
        },
        {
          heading: 'Finalidade educacional',
          body: (
            <p>
              O conteúdo tem caráter educativo e informativo. Nada aqui é recomendação individual de
              investimento.
            </p>
          ),
        },
      ]}
    />
  );
}
