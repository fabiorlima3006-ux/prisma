import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';

export default function NotFound() {
  return (
    <>
      <PageHeader
        eyebrow="erro 404"
        title="Página não encontrada"
        description="O endereço acessado não existe ou o ativo não faz parte do catálogo."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-3 text-base text-muted">Que tal começar por um destes caminhos?</p>
        <ul className="flex flex-wrap gap-4 text-base font-bold">
          <li>
            <Link href="/">Início</Link>
          </li>
          <li>
            <Link href="/mercados">Mercados</Link>
          </li>
          <li>
            <Link href="/educacao">Educação</Link>
          </li>
        </ul>
      </div>
    </>
  );
}
