import type { Metadata } from 'next';
import { classListMetadata, makeClassListPage } from '@/features/asset-page/routes';

export const revalidate = 900;
export const metadata: Metadata = classListMetadata(
  'stock',
  'Ações',
  'Acompanhe preço e variação das ações do catálogo e estude seus indicadores.',
);

export default makeClassListPage(
  'stock',
  'Ações',
  'Acompanhe preço e variação das ações do catálogo e estude seus indicadores.',
);
