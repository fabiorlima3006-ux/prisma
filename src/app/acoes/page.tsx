import type { Metadata } from 'next';
import { makeClassListPage } from '@/features/asset-page/routes';

export const revalidate = 900;
export const metadata: Metadata = { title: 'Ações' };

export default makeClassListPage(
  'stock',
  'Ações',
  'Acompanhe preço e variação das ações do catálogo e estude seus indicadores.',
);
