import type { Metadata } from 'next';
import { DISCLAIMER_TEXT } from '@/components/layout/Disclaimer';
import { LegalPage } from '@/features/legal/LegalPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Termos de uso',
  description: 'Regras simples para o uso desta plataforma de estudo.',
  path: '/termos',
});

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de uso"
      description="Regras simples para o uso desta plataforma de estudo."
      withDisclaimer={false}
      sections={[
        {
          heading: 'Aviso importante',
          body: <p>{DISCLAIMER_TEXT}</p>,
        },
        {
          heading: 'Conteúdo educativo',
          body: (
            <p>
              Todo o conteúdo, incluindo cotações, indicadores, simulações e textos, é educativo e
              informativo. Não é recomendação, oferta ou promessa de retorno, e não substitui a
              orientação de um profissional habilitado.
            </p>
          ),
        },
        {
          heading: 'Dados e simulações',
          body: (
            <p>
              Os dados podem conter atrasos, erros ou ser demonstrativos, o que é sempre sinalizado.
              Simulações usam premissas simplificadas e não preveem resultados reais.
            </p>
          ),
        },
        {
          heading: 'Responsabilidade',
          body: (
            <p>
              Decisões de investimento são de responsabilidade de quem as toma. O projeto não se
              responsabiliza por perdas decorrentes do uso das informações.
            </p>
          ),
        },
      ]}
    />
  );
}
