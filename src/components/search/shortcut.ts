/** Alvo de digitação (campo, área de texto, editável): o atalho não deve roubar o Ctrl/⌘+K dele. */
export function isTypingTarget(el: EventTarget | null): boolean {
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

/** Ctrl+K ou ⌘+K fora de um campo de digitação. */
export function isSearchShortcut(e: KeyboardEvent): boolean {
  return (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !isTypingTarget(e.target);
}

export const OPEN_SEARCH_EVENT = 'open-search';
