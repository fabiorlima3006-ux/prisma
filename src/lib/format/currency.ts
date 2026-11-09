const formatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: 'BRL' | 'USD'): Intl.NumberFormat {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { style: 'currency', currency });
    formatters.set(currency, f);
  }
  return f;
}

export function formatCurrency(value: number, currency: 'BRL' | 'USD' = 'BRL'): string {
  return currencyFormatter(currency).format(value);
}
