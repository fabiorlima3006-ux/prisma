import type { Metadata } from 'next';
import { classListMetadata, makeClassListPage } from '@/features/asset-page/routes';

export const revalidate = 900;
export const metadata: Metadata = classListMetadata(
  'crypto',
  'Criptomoedas',
  'Acompanhe preço e variação das criptomoedas do catálogo.',
);

export default makeClassListPage(
  'crypto',
  'Criptomoedas',
  'Acompanhe preço e variação das criptomoedas do catálogo.',
);
