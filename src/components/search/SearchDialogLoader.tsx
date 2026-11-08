'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { isSearchShortcut, OPEN_SEARCH_EVENT } from './shortcut';

type Dialog = ComponentType<{ defaultOpen?: boolean }>;

/**
 * Não carrega o módulo da busca no carregamento da página: escuta o Ctrl/⌘+K e o evento
 * `open-search` e, na primeira vez, importa o diálogo e o monta já aberto. Depois disso o
 * próprio diálogo cuida dos atalhos e o loader remove os seus.
 */
export function SearchDialogLoader() {
  const [Dialog, setDialog] = useState<Dialog | null>(null);

  useEffect(() => {
    if (Dialog) return;
    let cancelled = false;
    let loading = false;
    const load = () => {
      if (loading) return;
      loading = true;
      void import('./SearchDialog').then((m) => {
        if (!cancelled) setDialog(() => m.SearchDialog);
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isSearchShortcut(e)) return;
      e.preventDefault();
      load();
    };
    window.addEventListener(OPEN_SEARCH_EVENT, load);
    window.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      window.removeEventListener(OPEN_SEARCH_EVENT, load);
      window.removeEventListener('keydown', onKey);
    };
  }, [Dialog]);

  return Dialog ? <Dialog defaultOpen /> : null;
}
