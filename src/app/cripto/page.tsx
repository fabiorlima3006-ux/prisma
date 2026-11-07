import type { Metadata } from 'next';
import { makeClassListPage } from '@/features/asset-page/routes';

export const revalidate = 900;
export const metadata: Metadata = { title: 'Criptomoedas' };

export default makeClassListPage(
  'crypto',
  'Criptomoedas',
  'Acompanhe preço e variação das criptomoedas do catálogo.',
);
