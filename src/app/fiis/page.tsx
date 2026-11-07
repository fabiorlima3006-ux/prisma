import type { Metadata } from 'next';
import { classListMetadata, makeClassListPage } from '@/features/asset-page/routes';

export const revalidate = 900;
export const metadata: Metadata = classListMetadata(
  'fii',
  'Fundos imobiliários',
  'Acompanhe preço e variação dos fundos imobiliários do catálogo.',
);

export default makeClassListPage(
  'fii',
  'Fundos imobiliários',
  'Acompanhe preço e variação dos fundos imobiliários do catálogo.',
);
