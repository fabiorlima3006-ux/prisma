import { describe, expect, it } from 'vitest';
import { CATALOG, CLASS_ROUTES, getAsset, listByClass } from './catalog';

describe('catalog', () => {
  it('tem 17 ativos com chave classe/slug única', () => {
    expect(CATALOG).toHaveLength(17);
    expect(new Set(CATALOG.map((a) => `${a.class}/${a.slug}`)).size).toBe(17);
  });

  it('encontra ativo na classe correta e não na errada', () => {
    expect(getAsset('stock', 'petr4')?.ticker).toBe('PETR4');
    expect(getAsset('fii', 'petr4')).toBeUndefined();
  });

  it('lista por classe', () => {
    expect(listByClass('stock')).toHaveLength(5);
    expect(listByClass('fii')).toHaveLength(3);
    expect(listByClass('etf')).toHaveLength(2);
    expect(listByClass('crypto')).toHaveLength(2);
    expect(listByClass('index')).toHaveLength(4);
    expect(listByClass('currency')).toHaveLength(1);
  });

  it('mapeia rotas para classes', () => {
    expect(CLASS_ROUTES).toEqual({ acoes: 'stock', fiis: 'fii', etfs: 'etf', cripto: 'crypto' });
  });

  it('usa símbolo brapi do Ibovespa', () => {
    expect(getAsset('index', 'ibov')?.brapiSymbol).toBe('^BVSP');
  });
});
