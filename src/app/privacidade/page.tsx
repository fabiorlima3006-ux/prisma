import type { Metadata } from 'next';
import { LegalPage } from '@/features/legal/LegalPage';

export const metadata: Metadata = { title: 'Privacidade' };

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Privacidade"
      description="Esta plataforma não coleta dados pessoais."
      sections={[
        {
          heading: 'Dados pessoais',
          body: (
            <p>
              Não há cadastro e não coletamos nem armazenamos dados pessoais. Os valores digitados
              em simuladores e ferramentas são processados no seu navegador e não são enviados a
              nenhum servidor.
            </p>
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
