import type { Metadata } from 'next';
import { LegalPage } from '@/features/legal/LegalPage';
import { siteConfig } from '@/lib/config/site';

export const metadata: Metadata = { title: 'Contato' };

export default function ContatoPage() {
  return (
    <LegalPage
      title="Contato"
      description="Este é um projeto de estudo. O canal de contato é o repositório do projeto."
      withDisclaimer={false}
      sections={[
        {
          heading: 'Onde falar com a gente',
          body: (
            <p>
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold"
              >
                Perfil no GitHub
              </a>
            </p>
          ),
        },
      ]}
    />
  );
}
