import type { Metadata } from 'next';
import { LegalPage } from '@/features/legal/LegalPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Privacidade',
  description: 'Esta plataforma não coleta dados pessoais.',
  path: '/privacidade',
});

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Privacidade"
      description="Esta plataforma não coleta dados pessoais."
      sections={[
        {
          heading: 'Dados pessoais',
          body: (
            <>
              <p>
                Não há cadastro e não coletamos nem armazenamos dados pessoais. Os valores
                informados nos simuladores podem aparecer na URL, para que a simulação possa ser
                compartilhada, e são usados apenas para calcular a página exibida; não são
                armazenados.
              </p>
              <p>
                Para limitar abusos, o endereço IP é mantido temporariamente na memória do servidor
                e descartado na primeira requisição após 1 minuto (ou quando o servidor reinicia); a
                hospedagem pode registrar acessos em logs técnicos. Esses dados não são usados para
                identificar visitantes.
              </p>
            </>
          ),
        },
        {
          heading: 'Armazenamento no navegador',
          body: (
            <p>
              Guardamos apenas a sua preferência de tema (claro ou escuro) no armazenamento local
              (localStorage) do navegador. Você pode apagá-la a qualquer momento nas configurações
              do navegador.
            </p>
          ),
        },
        {
          heading: 'Cookies e rastreamento',
          body: (
            <p>Não usamos cookies de rastreamento nem ferramentas de análise de comportamento.</p>
          ),
        },
        {
          heading: 'Fontes de dados',
          body: (
            <p>
              Taxas e indicadores são obtidos do Banco Central do Brasil, e cotações podem vir da
              brapi. Essas consultas são feitas pelo servidor da plataforma e não incluem
              informações sobre você.
            </p>
          ),
        },
      ]}
    />
  );
}
