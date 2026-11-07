'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="erro"
        title="Algo deu errado"
        description="Não foi possível carregar esta página agora."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <Button type="button" onClick={() => reset()}>
          Tentar novamente
        </Button>
      </div>
    </>
  );
}
