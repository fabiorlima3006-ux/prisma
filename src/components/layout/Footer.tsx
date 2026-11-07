import Link from 'next/link';
import { siteConfig } from '@/lib/config/site';
import { Disclaimer } from './Disclaimer';

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Plataforma',
    links: [
      { label: 'Mercados', href: '/mercados' },
      { label: 'Simuladores', href: '/simuladores' },
      { label: 'Ferramentas', href: '/ferramentas' },
    ],
  },
  {
    title: 'Educação',
    links: [
      { label: 'Educação', href: '/educacao' },
      { label: 'Notícias', href: '/noticias' },
    ],
  },
  {
    title: 'Institucional',
    links: [
      { label: 'Sobre', href: '/sobre' },
      { label: 'Contato', href: '/contato' },
      { label: 'Termos', href: '/termos' },
      { label: 'Privacidade', href: '/privacidade' },
    ],
  },
];

export function Footer() {
  return (
    <footer id="rodape" className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3 font-mono text-xs tracking-wider text-muted">{`// ${col.title}`}</h2>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-text hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-3 border-t border-line pt-6">
          <Disclaimer variant="footer" />
          <p className="text-xs text-muted">
            Indicadores econômicos: Banco Central do Brasil (SGS). Cotações: brapi.dev, quando
            configurado; caso contrário, DADOS DEMONSTRATIVOS.
          </p>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {siteConfig.name} — projeto de estudo
          </p>
        </div>
      </div>
    </footer>
  );
}
