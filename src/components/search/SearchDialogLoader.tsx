'use client';

import dynamic from 'next/dynamic';

// ssr:false só é permitido em componentes de cliente.
const SearchDialog = dynamic(() => import('./SearchDialog').then((m) => m.SearchDialog), {
  ssr: false,
});

export function SearchDialogLoader() {
  return <SearchDialog />;
}
