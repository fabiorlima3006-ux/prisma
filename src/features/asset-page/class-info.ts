import { CLASS_ROUTES } from '@/lib/data/catalog';
import type { AssetClass } from '@/lib/data/types';

/** Classe do catálogo -> segmento de rota da lista (ex.: stock -> /acoes). Índices e câmbio não têm página. */
export const CLASS_PATHS: Partial<Record<AssetClass, string>> = Object.fromEntries(
  Object.entries(CLASS_ROUTES).map(([segment, cls]) => [cls, `/${segment}`]),
);

export const CLASS_LABELS: Record<AssetClass, string> = {
  stock: 'Ações',
  fii: 'FIIs',
  etf: 'ETFs',
  crypto: 'Criptomoedas',
  index: 'Índices',
  currency: 'Câmbio',
};

export function assetHref(asset: { class: AssetClass; slug: string }): string | undefined {
  const base = CLASS_PATHS[asset.class];
  return base ? `${base}/${asset.slug}` : undefined;
}
