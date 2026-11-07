'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { groupByType, search, TYPE_LABELS, type SearchEntry } from '@/lib/search/search';

let cachedIndex: SearchEntry[] | null = null;

type Status = 'idle' | 'loading' | 'ready' | 'error';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.getAttribute('role') === 'combobox') return false;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    el.isContentEditable ||
    el.getAttribute('contenteditable') === 'true'
  );
}

export function SearchDialog({ index: indexProp }: { index?: SearchEntry[] }) {
  const router = useRouter();
  const uid = useId();
  const listId = `${uid}-lista`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<SearchEntry[] | null>(indexProp ?? cachedIndex);
  const [status, setStatus] = useState<Status>(indexProp || cachedIndex ? 'ready' : 'idle');

  useEffect(() => {
    const openDialog = () => setOpen(true);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        openDialog();
      }
    };
    window.addEventListener('open-search', openDialog);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('open-search', openDialog);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!open || loaded || status === 'loading' || status === 'error') return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inicia o carregamento sob demanda
    setStatus('loading');
    fetch('/search-index.json')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<SearchEntry[]>;
      })
      .then((data) => {
        cachedIndex = data;
        if (cancelled) return;
        setLoaded(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [open, loaded, status]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  const flat = useMemo(() => {
    if (!loaded) return [];
    return groupByType(search(query, loaded)).flatMap((g) => g.items);
  }, [query, loaded]);
  const groups = useMemo(() => groupByType(flat), [flat]);
  const optionId = (i: number) => `${uid}-opcao-${i}`;
  const trimmed = query.trim();

  function go(entry: SearchEntry) {
    router.push(entry.href);
    close();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown' && flat.length > 0) {
      e.preventDefault();
      setActive((a) => (a + 1) % flat.length);
    } else if (e.key === 'ArrowUp' && flat.length > 0) {
      e.preventDefault();
      setActive((a) => (a - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      const entry = flat[active];
      if (entry) {
        e.preventDefault();
        go(entry);
      }
    }
  }

  const activeEntry = flat[active];

  return (
    <Modal open={open} onClose={close} title="Buscar">
      {open && (
        <div onKeyDown={onKeyDown}>
          <input
            autoFocus
            type="text"
            role="combobox"
            aria-label="Buscar ativos, ferramentas e artigos"
            aria-expanded={flat.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeEntry ? optionId(active) : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Buscar ativos, ferramentas e artigos"
            className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-text"
          />
          <div className="mt-3 max-h-[50vh] overflow-y-auto">
            {status === 'loading' && <p className="text-sm text-muted">Carregando…</p>}
            {status === 'error' && (
              <p className="text-sm text-muted">
                Não foi possível carregar a busca.{' '}
                <Link href="/busca" onClick={close} className="font-bold underline">
                  Ir para a página de busca
                </Link>
              </p>
            )}
            {status === 'ready' && trimmed && flat.length === 0 && (
              <p className="text-sm text-muted">
                {`Nenhum resultado para “${trimmed}”.`}{' '}
                <Link
                  href={`/busca?q=${encodeURIComponent(trimmed)}`}
                  onClick={close}
                  className="font-bold underline"
                >
                  Ver todos os resultados
                </Link>
              </p>
            )}
            <div id={listId} role="listbox" aria-label="Resultados" hidden={flat.length === 0}>
              {groups.map((g) => (
                <div key={g.type} role="group" aria-label={TYPE_LABELS[g.type]}>
                  <p
                    aria-hidden="true"
                    className="px-2 pt-2 pb-1 font-mono text-xs tracking-wider text-muted"
                  >
                    {`// ${TYPE_LABELS[g.type]}`}
                  </p>
                  {g.items.map((entry) => {
                    const i = flat.indexOf(entry);
                    return (
                      <div
                        key={entry.type + entry.href + entry.title}
                        id={optionId(i)}
                        role="option"
                        aria-selected={i === active}
                        onClick={() => go(entry)}
                        onMouseMove={() => setActive(i)}
                        className={`cursor-pointer rounded-lg px-2 py-2 ${
                          i === active ? 'bg-surface-2' : ''
                        }`}
                      >
                        <span className="font-bold">{entry.title}</span>
                        {entry.subtitle && (
                          <span className="block text-sm text-muted">{entry.subtitle}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
