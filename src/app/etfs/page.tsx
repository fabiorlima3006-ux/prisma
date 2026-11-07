import type { Metadata } from 'next';
import { classListMetadata, makeClassListPage } from '@/features/asset-page/routes';

export const revalidate = 900;
export const metadata: Metadata = classListMetadata(
  'etf',
  'ETFs',
  'Acompanhe preço e variação dos fundos de índice do catálogo.',
);

export default makeClassListPage(
  'etf',
  'ETFs',
  'Acompanhe preço e variação dos fundos de índice do catálogo.',
);
