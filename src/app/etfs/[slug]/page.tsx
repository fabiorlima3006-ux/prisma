import { makeAssetRoute } from '@/features/asset-page/routes';

const route = makeAssetRoute('etf');

export const revalidate = 900;
export const dynamicParams = true;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
