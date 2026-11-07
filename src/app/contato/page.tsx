import type { Metadata } from 'next';
import { LegalPage } from '@/features/legal/LegalPage';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Contato',
  description: 'Este é um projeto de estudo; o canal de contato é o repositório do projeto.',
  path: '/contato',
});

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
