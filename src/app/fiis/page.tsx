import type { Metadata } from 'next';
import { makeClassListPage } from '@/features/asset-page/routes';

export const revalidate = 900;
export const metadata: Metadata = { title: 'Fundos imobiliários' };

export default makeClassListPage(
  'fii',
  'Fundos imobiliários',
  'Acompanhe preço e variação dos fundos imobiliários do catálogo.',
);
