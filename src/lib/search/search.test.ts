import { beforeAll, describe, expect, it } from 'vitest';
import { buildSearchIndex } from './build-index';
import { normalize } from './normalize';
import { search, type SearchEntry } from './search';

let idx: SearchEntry[];
beforeAll(async () => {
  idx = await buildSearchIndex();
});

describe('normalize', () => {
  it('remove diacríticos, caixa e espaços', () => {
    expect(normalize('  Ações ')).toBe('acoes');
    expect(normalize('a   b')).toBe('a b');
  });
});

describe('buildSearchIndex', () => {
  it('nunca indexa /investimentos', () => {
    expect(idx.some((e) => e.href === '/investimentos')).toBe(false);
  });

  it('não indexa ativos sem página', () => {
    expect(idx.some((e) => e.title === 'IBOV' || e.title === 'USDBRL')).toBe(false);
  });

  it('ferramenta planejada traz "Em breve" no subtítulo', () => {
    const e = idx.find((x) => x.type === 'tool' && x.title === 'Renda passiva');
    expect(e?.subtitle).toContain('Em breve');
  });

  it('não repete hrefs entre páginas', () => {
    const hrefs = idx.filter((e) => e.type === 'page').map((e) => e.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe('search', () => {
  it('acha ativo por ticker', () => {
    expect(search('petr4', idx)[0]).toMatchObject({ type: 'asset', href: '/acoes/petr4' });
    expect(search('PETR', idx)[0]!.href).toBe('/acoes/petr4');
  });

  it('acha artigo ignorando acentos', () => {
    expect(
      search('inflacao', idx).some(
        (e) => e.href === '/educacao/iniciante/juros-compostos-e-inflacao',
      ),
    ).toBe(true);
  });

  it('acha ferramenta', () => {
    expect(search('juros', idx).some((e) => e.href === '/simuladores/juros-compostos')).toBe(true);
  });

  it('query vazia devolve []', () => {
    expect(search('', idx)).toEqual([]);
    expect(search('   ', idx)).toEqual([]);
  });

  it('várias palavras exigem todas (AND)', () => {
    const hits = search('petrobras pn', idx);
    expect(hits[0]?.href).toBe('/acoes/petr4');
    expect(search('petrobras zzzzz', idx)).toEqual([]);
  });

  it('respeita o limite e desempata por tipo', () => {
    expect(search('a', idx, 3)).toHaveLength(3);
    const e = (type: SearchEntry['type'], title: string): SearchEntry => ({
      type,
      title,
      href: `/${type}`,
      keywords: [],
    });
    const out = search('x', [e('page', 'x'), e('article', 'x'), e('tool', 'x'), e('asset', 'x')]);
    expect(out.map((o) => o.type)).toEqual(['asset', 'tool', 'article', 'page']);
  });
});
