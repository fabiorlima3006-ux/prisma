# MVP da Plataforma de Investimentos — Plano de Implementação

> **Para agentes executores:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** entregar o MVP descrito no spec: Home, Mercados, páginas de ativo, simulador de juros compostos, comparador de renda fixa, Educação, busca, temas claro e escuro, camada de dados trocável, testes e documentação. O projeto termina pronto para deploy na Vercel.

**Arquitetura:**
- Next.js App Router, com Server Components por padrão.
- `src/lib/finance` contém os cálculos puros.
- `src/lib/data` é a única camada que conversa com fornecedores (BCB, brapi, demo).
- Todo dado de mercado viaja como `DataResult<T>`, que carrega `DataMeta`. A UI decide o selo a partir de `meta.isDemo` e `meta.source`.

**Stack:** Next.js (estável atual) · React · TypeScript estrito · Tailwind CSS v4 · next-themes · Zod · Recharts · @next/mdx · Vitest + Testing Library · Playwright + @axe-core/playwright · npm.

**Spec:** `docs/superpowers/specs/2026-11-07-plataforma-investimentos-design.md`. Leia junto com este plano. Leia também `CLAUDE.md` e as skills `.claude/skills/financial-analysis` e `.claude/skills/options-analysis`.

## Restrições globais

- **Ambiente:** Windows 11, Node 26, npm 11. Os comandos são POSIX (Git Bash) ou npm scripts.
- **Idioma:** UI, conteúdo e documentação em pt-BR. Identificadores em inglês.
- **TypeScript:** `tsconfig` com `"strict": true` e `"noUncheckedIndexedAccess": true`. Sem `any` sem comentário de justificativa.
- **Animações:** nenhuma biblioteca de animação. Use SVG e CSS, com `prefers-reduced-motion: reduce` deixando tudo estático no estado final.
- **Segredos:** só em `.env.local`, que está no `.gitignore`. O único segredo é `BRAPI_TOKEN`, opcional. `BCB_BASE_URL` é opcional, com padrão `https://api.bcb.gov.br`.
- **Textos fixos (copie exatamente):**
  - selo de demonstração: `DADOS DEMONSTRATIVOS`;
  - ausência de dado: `Dado não disponível`;
  - sem significado: `Não se aplica`;
  - fonte real que falhou: `Dado indisponível no momento`.
  - **Aviso padrão:** "As informações disponibilizadas nesta plataforma possuem finalidade educacional e informativa. Simulações e análises não constituem recomendação individual de investimento. Rentabilidade passada não garante resultados futuros. Investimentos envolvem riscos."
  - **H1 da Home:** "Entenda o mercado. Analise seus investimentos. Tome decisões mais conscientes."
  - **Subtítulo da Home:** "Uma plataforma completa para acompanhar mercados, estudar investimentos, analisar ativos e simular cenários."
  - **CTAs da Home:** "Explorar mercados" e "Conhecer ferramentas".
  - **Destaque do comparador:** "maior valor líquido nesta simulação".
- **Proibido na UI:** "compre", "venda" (como recomendação), "melhor investimento", "barato", "caro", "oportunidade", "garantido", contagem regressiva e preço riscado.
- **Tokens de cor:** os da seção 6.2 do spec. Ajuste o valor se o contraste não atingir AA.
- **Fontes:** Inter (texto) e JetBrains Mono (rótulos `//` e números), via `next/font/google`.
- **Nome:** "Prisma", só em `siteConfig.name`. O GitHub fica em `siteConfig.links.github`, com valor `"https://github.com/"` como espaço reservado até Fabio informar o usuário.
- **Commits:** o `CLAUDE.md` diz "commits só quando o Fabio pedir". Execute os passos "Commit" **apenas** se Fabio tiver autorizado commits por tarefa nesta execução. Caso contrário, pule o passo e deixe as mudanças no working tree.
- **Cache:** revalidação de 3600 s no BCB e 900 s na brapi. Timeout de fetch externo de 5000 ms (`AbortSignal.timeout`).
- **Rotas de API:** rate limit de 60 requisições por minuto por IP.

## Review Focus

1. **Números digitados no formato brasileiro** ("1.000,50", "12,5", campo vazio). O simulador e o comparador devem interpretar corretamente ou mostrar um erro de campo, nunca `NaN` ou "R$ NaN". Coberto na Tarefa 2 (`parseBrNumber`) e na Tarefa 14.
2. **BCB fora do ar ou respondendo `[]`/valor vazio durante o build ou o ISR.** O build não pode quebrar, e a tela mostra "Dado indisponível no momento". Coberto na Tarefa 6 (array vazio → `unavailable`) e na Tarefa 19 (E2E com `BCB_BASE_URL` inacessível).
3. **Ticker digitado em maiúsculas ou na classe errada** (`/acoes/PETR4`, `/fiis/petr4`). Maiúsculas redirecionam para minúsculas; classe errada leva a 404. Coberto na Tarefa 13.
4. **Valores extremos no simulador** (600 meses a 100% a.m., capital 1e12). O resultado é finito ou vira erro de validação, nunca `Infinity` na tela, e a tabela anual tem no máximo 50 linhas. Coberto na Tarefa 3.
5. **Usuário com "reduzir movimento" ativado.** Nenhuma animação roda. Coberto na Tarefa 19 (`reducedMotion: 'reduce'` + verificação de `animation-name: none`).

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/config/site.ts` | nome, URL base, links, navegação |
| `src/lib/config/env.ts` | leitura e validação do `process.env` (server-only) |
| `src/lib/config/tax-rules.ts` | regras tributárias com `effectiveFrom`, `source`, `verifiedAt` |
| `src/lib/config/tools.ts` | registro das ferramentas (para a busca, os hubs e a faixa de números) |
| `src/lib/config/features.ts` | registro de planos, com `canAccess` |
| `src/lib/format/*.ts` | formatação e interpretação pt-BR |
| `src/lib/finance/compound-interest.ts` | juros compostos |
| `src/lib/finance/tax.ts` | IR regressivo e dias úteis |
| `src/lib/finance/fixed-income.ts` | CDB, Tesouro Selic, LCI/LCA, poupança e comparação |
| `src/lib/data/types.ts` | `DataMeta`, `DataResult`, `Asset`, `Quote` etc. |
| `src/lib/data/catalog.ts` | catálogo curado |
| `src/lib/data/providers/{demo,bcb,brapi}.ts` | provedores |
| `src/lib/data/service.ts` | escolha do provedor |
| `src/lib/data/index.ts` | instância do serviço para o app (server-only) |
| `src/lib/security/rate-limit.ts` · `headers.ts` | rate limit e cabeçalhos |
| `src/lib/search/*.ts` | normalização, índice e busca |
| `src/lib/seo/*.ts` | helpers de metadata e JSON-LD |
| `src/components/ui/*` | primitivas visuais |
| `src/components/layout/*` | header, rodapé, navegação, aviso |
| `src/components/market/*` | componentes de dado de mercado |
| `src/components/charts/*` | wrappers do Recharts |
| `src/components/illustrations/*` | SVGs animados |
| `src/features/*` | telas compostas (asset-page, compound-interest, fixed-income-comparator, education, search) |
| `content/educacao/<trilha>/<artigo>.mdx` | artigos |
| `tests/e2e/*.spec.ts` | Playwright |

---

### Tarefa 1: Scaffold, tooling e configuração do site

**Arquivos:**
- Criar: projeto Next.js na raiz; `src/lib/config/site.ts`; `vitest.config.ts`; `vitest.setup.ts`; `playwright.config.ts`; `.env.example`; `.prettierrc`; `src/lib/config/site.test.ts`
- Modificar: `.gitignore` (mesclar com o gerado), `CLAUDE.md` (seção Comandos)

**Interfaces:**
- Produz:
  ```ts
  export const siteConfig: {
    name: 'Prisma'; description: string; url: string /* de NEXT_PUBLIC_SITE_URL ou 'http://localhost:3000' */;
    links: { github: string };
    nav: NavItem[]; userNav: NavItem[];
  };
  type NavItem = { label: string; href: string; children?: NavItem[] };
  ```
  O `nav` é: Mercados `/mercados`; Investimentos (filhos: Ações `/acoes`, FIIs `/fiis`, ETFs `/etfs`, Fundos `/fundos`, Renda fixa `/renda-fixa`, Cripto `/cripto`); Opções `/opcoes`; Simuladores `/simuladores`; Ferramentas `/ferramentas`; Educação `/educacao`; Notícias `/noticias`. O `userNav` é: Carteira `/carteira`, Análises `/analises`, Assistente `/assistente`, Meu Perfil `/perfil`.
- npm scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:watch`, `test:e2e` (`playwright test`), `format`.

- [ ] **Passo 1:** gere o app com `npx create-next-app@latest` (TypeScript, Tailwind, ESLint, App Router, `src/`, alias `@/*`, npm) **em uma pasta temporária** e mova os arquivos para a raiz, porque a raiz já tem `CLAUDE.md`, `docs/` e `.claude/`. Mescle o `.gitignore`, mantendo `.superpowers/`, `.env*` e `!.env.example`.
- [ ] **Passo 2:** ative `strict` e `noUncheckedIndexedAccess`. Instale as dependências de desenvolvimento: `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test @axe-core/playwright prettier eslint-plugin-jsx-a11y`. Instale as de runtime: `zod next-themes server-only`. Configure o Vitest com ambiente `jsdom`, alias `@`, e `include: ['src/**/*.test.{ts,tsx}']`.
- [ ] **Passo 3:** escreva o teste que falha, `site.test.ts`:
  ```ts
  it('expõe todas as rotas de navegação do spec', () => {
    const hrefs = [...siteConfig.nav, ...siteConfig.nav.flatMap(i => i.children ?? []), ...siteConfig.userNav].map(i => i.href);
    expect(hrefs).toEqual(expect.arrayContaining(['/mercados','/acoes','/fiis','/etfs','/fundos','/renda-fixa','/cripto','/opcoes','/simuladores','/ferramentas','/educacao','/noticias','/carteira','/analises','/assistente','/perfil']));
  });
  it('nome centralizado', () => expect(siteConfig.name).toBe('Prisma'));
  ```
- [ ] **Passo 4:** rode `npm test`. Deve FALHAR, porque o módulo ainda não existe.
- [ ] **Passo 5:** implemente `site.ts`.
- [ ] **Passo 6:** rode `npm test && npm run lint && npm run typecheck && npm run build`. Tudo deve PASSAR.
- [ ] **Passo 7:** configure o Playwright:
  - projetos `desktop` (chromium, 1280×800) e `mobile` (chromium, 375×812, `isMobile: true`);
  - `webServer: { command: 'npm run build && npm run start', url: 'http://localhost:3000', env: { BCB_BASE_URL: 'http://127.0.0.1:9' } }`;
  - `grepInvert: /@live/`.

  Crie `.env.example` com `BRAPI_TOKEN=`, `BCB_BASE_URL=` e `NEXT_PUBLIC_SITE_URL=`, cada um com um comentário explicativo. Atualize a seção Comandos do `CLAUDE.md`.
- [ ] **Passo 8:** commit `chore: scaffold Next.js, tooling e siteConfig`.

---

### Tarefa 2: Formatação e interpretação pt-BR

**Arquivos:** Criar `src/lib/format/{number,currency,percent,date}.ts`, `src/lib/format/index.ts`, `src/lib/format/format.test.ts`

**Interfaces (produz):**
```ts
formatCurrency(value: number, currency?: 'BRL'|'USD'): string        // Intl pt-BR
formatPercent(fraction: number, opts?: { decimals?: number; signed?: boolean }): string // 0.0123 → "1,23%"
formatNumber(value: number, decimals?: number): string
formatDate(iso: string): string                                       // "07/11/2026"
formatDateTime(iso: string): string                                   // "07/11/2026 14:30"
parseBrNumber(input: string): number | null
```

- [ ] **Passo 1:** testes que falham. Atenção: o Intl usa espaço não separável (U+00A0) depois de "R$". Compare com `.replace(/\s/g,' ')`.
  ```ts
  expect(formatCurrency(1234.5).replace(/\s/g,' ')).toBe('R$ 1.234,50');
  expect(formatPercent(0.0123)).toBe('1,23%');
  expect(formatPercent(0.0123, { signed: true })).toBe('+1,23%');
  expect(formatPercent(-0.004, { signed: true })).toBe('-0,40%');
  expect(formatPercent(-0.00001)).toBe('0,00%');           // sem "-0,00%"
  expect(formatDate('2026-11-07')).toBe('07/11/2026');
  expect(parseBrNumber('1.000,50')).toBe(1000.5);
  expect(parseBrNumber('12,5')).toBe(12.5);
  expect(parseBrNumber('1000')).toBe(1000);
  expect(parseBrNumber(' 7 ')).toBe(7);
  expect(parseBrNumber('')).toBeNull();
  expect(parseBrNumber('abc')).toBeNull();
  expect(parseBrNumber('1,2,3')).toBeNull();
  ```
- [ ] **Passo 2:** `npm test -- format`. Deve FALHAR.
- [ ] **Passo 3:** implemente. `formatDate` deve tratar a data ISO sem hora como data local, para evitar o deslocamento de fuso.
- [ ] **Passo 4:** `npm test -- format`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(format): formatação e parse pt-BR`.

---

### Tarefa 3: Juros compostos

**Arquivos:** Criar `src/lib/finance/compound-interest.ts`, `src/lib/finance/rates.ts`, `src/lib/finance/compound-interest.test.ts`

**Interfaces (produz):**
```ts
// rates.ts
annualToMonthly(annual: number): number        // (1+a)^(1/12) − 1
monthlyToAnnual(monthly: number): number
// compound-interest.ts
export const compoundInterestInputSchema: z.ZodType<CompoundInterestInput>;
type CompoundInterestInput = {
  initial: number;        // ≥ 0, ≤ 1e12
  monthlyContribution: number; // ≥ 0, ≤ 1e12
  rate: number;           // fração, ≥ 0; ao mês ≤ 1 (100%); ao ano ≤ 1e4 equivalente
  ratePeriod: 'month' | 'year';
  months: number;         // inteiro 1..600
};
type MonthRow = { month: number; invested: number; interest: number; balance: number };
type CompoundInterestResult = { finalBalance: number; totalInvested: number; totalInterest: number; monthlyRate: number; rows: MonthRow[] };
compoundInterest(input: CompoundInterestInput): CompoundInterestResult
yearlySummary(rows: MonthRow[]): MonthRow[]    // uma linha por ano + última parcial; ≤ 50 linhas
```
**Modelo** (seção 9.5 do spec): capitalização mensal, aporte no fim do mês e `VF = P(1+i)^n + A((1+i)^n − 1)/i`, com `i = 0` → `P + A·n`. As `rows` são calculadas iterativamente. As mensagens de erro do Zod ficam em português (por exemplo "Informe um prazo entre 1 e 600 meses").

- [ ] **Passo 1:** testes que falham. Valores de referência calculados de forma independente (fórmula fechada à mão):
  ```ts
  expect(annualToMonthly(0.12)).toBeCloseTo(0.009488793, 8);
  expect(monthlyToAnnual(annualToMonthly(0.12))).toBeCloseTo(0.12, 10);
  const r1 = compoundInterest({ initial: 1000, monthlyContribution: 100, rate: 0.01, ratePeriod: 'month', months: 12 });
  expect(r1.finalBalance).toBeCloseTo(2395.08, 2); expect(r1.totalInvested).toBe(2200); expect(r1.totalInterest).toBeCloseTo(195.08, 2);
  const r2 = compoundInterest({ initial: 10000, monthlyContribution: 0, rate: 0.005, ratePeriod: 'month', months: 120 });
  expect(r2.finalBalance).toBeCloseTo(18193.97, 2);
  const r3 = compoundInterest({ initial: 1000, monthlyContribution: 100, rate: 0, ratePeriod: 'month', months: 12 });
  expect(r3.finalBalance).toBe(2200); expect(r3.totalInterest).toBe(0);
  const r4 = compoundInterest({ initial: 1000, monthlyContribution: 0, rate: 0.12, ratePeriod: 'year', months: 12 });
  expect(r4.finalBalance).toBeCloseTo(1120, 6);
  // tabela iterativa == fórmula fechada
  expect(r1.rows.at(-1)!.balance).toBeCloseTo(r1.finalBalance, 6); expect(r1.rows).toHaveLength(12);
  // Review Focus 4: extremos
  const big = compoundInterest({ initial: 1e12, monthlyContribution: 1e12, rate: 1, ratePeriod: 'month', months: 600 });
  expect(Number.isFinite(big.finalBalance)).toBe(true);
  expect(yearlySummary(big.rows).length).toBeLessThanOrEqual(50);
  expect(compoundInterestInputSchema.safeParse({ initial: 0, monthlyContribution: 0, rate: 0.01, ratePeriod: 'month', months: 601 }).success).toBe(false);
  expect(compoundInterestInputSchema.safeParse({ initial: -1, monthlyContribution: 0, rate: 0.01, ratePeriod: 'month', months: 12 }).success).toBe(false);
  ```
  Dentro dos limites do schema, o pior caso é `1e12 · 2^600 ≈ 4e192`, que é finito. Mesmo assim, adicione ao schema um `refine` de segurança que recuse qualquer combinação cujo `(1+i)^n` não seja finito, com a mensagem "Combinação de valores grande demais para simular".
- [ ] **Passo 2:** `npm test -- compound`. Deve FALHAR.
- [ ] **Passo 3:** implemente.
- [ ] **Passo 4:** `npm test -- compound`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(finance): juros compostos com tabela mensal`.

---

### Tarefa 4: Regras tributárias verificadas e IR regressivo

**Arquivos:** Criar `src/lib/config/tax-rules.ts`, `src/lib/finance/tax.ts`, `src/lib/finance/tax.test.ts`

**Interfaces (produz):**
```ts
type Sourced = { effectiveFrom: string; source: string /* URL oficial */; verifiedAt: string | null };
type TaxRules = {
  incomeTaxBrackets: Sourced & { brackets: { upToDays: number | null; rate: number }[] }; // null = acima
  lciLca: Sourced & { pfExempt: boolean; minHoldingDays: { lci: number; lca: number } };
  tesouroCustody: Sourced & { annualRate: number; selicExemptUpTo: number };
  savings: Sourced & { selicThreshold: number /* 0.085 */; fixedMonthly: number /* 0.005 */; selicShare: number /* 0.7 */ };
};
export const TAX_RULES: TaxRules;
incomeTaxRate(holdingDays: number, rules?: TaxRules['incomeTaxBrackets']): number
businessDaysApprox(calendarDays: number): number   // Math.round(dc * 252 / 365)
```

- [ ] **Passo 1:** **verifique as regras na fonte oficial** com WebFetch ou WebSearch:
  - IR regressivo: Receita Federal, IN RFB 1.585/2015, art. 46.
  - Poupança: Lei 12.703/2012 / BCB.
  - Isenção e carência mínima de LCI/LCA: Lei 11.033/2004 e resoluções CMN de 2024 sobre prazos mínimos. Confira se houve alteração posterior.
  - Custódia do Tesouro: site do Tesouro Direto / B3.

  Preencha `source` com a URL, `effectiveFrom` e `verifiedAt: '2026-11-07'`, ou `null` se não conseguir confirmar. Nesse caso, liste a regra como "não verificada" no relatório para o Fabio. Se a fonte divergir do spec, vale a fonte, e a divergência entra no relatório.
- [ ] **Passo 2:** testes que falham. Use fixtures explícitas, não `TAX_RULES`, para que a verificação não quebre os testes:
  ```ts
  const B = { effectiveFrom:'2005-01-01', source:'x', verifiedAt:null, brackets:[{upToDays:180,rate:0.225},{upToDays:360,rate:0.2},{upToDays:720,rate:0.175},{upToDays:null,rate:0.15}] };
  expect([180,181,360,361,720,721].map(d => incomeTaxRate(d, B))).toEqual([0.225,0.2,0.2,0.175,0.175,0.15]);
  expect(incomeTaxRate(1, B)).toBe(0.225);
  expect(businessDaysApprox(30)).toBe(21); expect(businessDaysApprox(365)).toBe(252);
  it('TAX_RULES tem fonte em toda regra', () => Object.values(TAX_RULES).forEach(r => expect(r.source).toMatch(/^https:\/\//)));
  ```
- [ ] **Passo 3:** `npm test -- tax`. Deve FALHAR.
- [ ] **Passo 4:** implemente.
- [ ] **Passo 5:** `npm test -- tax`. Deve PASSAR.
- [ ] **Passo 6:** commit `feat(finance): regras tributárias com fonte e IR regressivo`.

---

### Tarefa 5: Comparador de renda fixa (cálculo)

**Arquivos:** Criar `src/lib/finance/fixed-income.ts`, `src/lib/finance/fixed-income.test.ts`, `src/lib/finance/fixed-income-meta.ts` (colunas qualitativas com fonte)

**Interfaces:**
- Consome: `incomeTaxRate`, `businessDaysApprox`, `TaxRules` (Tarefa 4).
- Produz:
  ```ts
  type ComparatorInput = { amount: number; calendarDays: number /* ≥ 30 */; cdbPctCdi: number /* 1 = 100% */; lciLcaPctCdi: number; rates: { cdiAnnual: number; selicAnnual: number; trMonthly: number } };
  type ProductId = 'savings' | 'cdb' | 'tesouro-selic' | 'lci' | 'lca';
  type ComparisonRow =
    | { product: ProductId; available: true; gross: number; tax: number; costs: number; net: number; netReturn: number; netReturnAnnualized: number }
    | { product: ProductId; available: false; reason: string };
  export const comparatorInputSchema: z.ZodType<ComparatorInput>;
  compareFixedIncome(input: ComparatorInput, rules: TaxRules): ComparisonRow[]   // ordem fixa: savings, cdb, tesouro-selic, lci, lca
  highestNet(rows: ComparisonRow[]): ProductId | null   // só linhas available; empate → a primeira na ordem fixa
  PRODUCT_META: Record<ProductId, { label: string; liquidity: string; risk: string; fgc: string; source: string }>
  ```
**Modelos** (seção 9.6 do spec), com uma correção documentada:
- **% do CDI usa a convenção diária de mercado:** `fator = (1 + p·((1+CDI)^(1/252) − 1))^du`. A fórmula `(1+CDI·p)^(du/252)` do spec só é igual quando `p = 1`. Registre o ADR em `ARCHITECTURE.md` na Tarefa 20.
- **Tesouro Selic:** `(1+Selic)^(du/252)`, com IR regressivo. A custódia é `annualRate × max(0, amount − selicExemptUpTo) × du/252`.
- **Poupança:** meses completos `= Math.floor(calendarDays/30)`. A taxa mensal é `fixedMonthly` se `selic > selicThreshold`; senão, `(1 + selicShare·selic)^(1/12) − 1`. O fator mensal é `(1+base)(1+TR)`. Isenta de IR.
- **LCI/LCA:** se `calendarDays < minHoldingDays`, a linha volta como `available: false` com o motivo `não disponível para este prazo (carência mínima de N dias)`.

- [ ] **Passo 1:** testes que falham. `R` é a fixture com IR padrão, `minHoldingDays {lci:270, lca:270}`, custódia `0.002` isenta até `10000`, e poupança `0.085 / 0.005 / 0.7`. Valores calculados à mão:
  ```ts
  const base = { amount: 10000, calendarDays: 365, cdbPctCdi: 1, lciLcaPctCdi: 0.9, rates: { cdiAnnual: 0.10, selicAnnual: 0.105, trMonthly: 0 } };
  const rows = compareFixedIncome(base, R); const by = (p) => rows.find(r => r.product === p)!;
  expect(by('cdb')).toMatchObject({ available: true }); expect(by('cdb').gross).toBeCloseTo(11000, 2); expect(by('cdb').tax).toBeCloseTo(175, 2); expect(by('cdb').net).toBeCloseTo(10825, 2);
  expect(by('lci').net).toBeCloseTo(10895.67, 0); expect(by('lci').tax).toBe(0);
  expect(by('savings').net).toBeCloseTo(10616.78, 2);                          // Selic 10,5% > 8,5% → 0,5% a.m. × 12
  const low = compareFixedIncome({ ...base, rates: { ...base.rates, selicAnnual: 0.07 } }, R);
  expect(low.find(r => r.product==='savings')!.net).toBeCloseTo(10490, 2);      // 70% × 7% = 4,9% a.a.
  const tr = compareFixedIncome({ ...base, rates: { ...base.rates, trMonthly: 0.001 } }, R);
  expect(tr.find(r=>r.product==='savings')!.net).toBeCloseTo(10000 * 1.006005 ** 12, 2);
  expect(by('tesouro-selic').costs).toBe(0);                                    // 10.000 ≤ isenção
  const t2 = compareFixedIncome({ ...base, amount: 20000 }, R).find(r => r.product==='tesouro-selic')!;
  expect(t2.costs).toBeCloseTo(0.002 * 10000 * 252/252, 2);
  const short = compareFixedIncome({ ...base, calendarDays: 269 }, R);
  expect(short.find(r=>r.product==='lci')).toMatchObject({ available: false, reason: expect.stringContaining('270') });
  expect(compareFixedIncome({ ...base, calendarDays: 270 }, R).find(r=>r.product==='lci')!.available).toBe(true);
  expect(comparatorInputSchema.safeParse({ ...base, calendarDays: 29 }).success).toBe(false);
  expect(highestNet(rows)).toBe('lci');                 // LCI e LCA empatam em 10.895,67 → a primeira na ordem
  expect(highestNet(short)).toBe('tesouro-selic');      // LCI/LCA indisponíveis; Tesouro 10.866,25 > CDB 10.825
  expect(by('tesouro-selic').net).toBeCloseTo(10866.25, 2);
  ```
- [ ] **Passo 2:** `npm test -- fixed-income`. Deve FALHAR.
- [ ] **Passo 3:** implemente, incluindo `PRODUCT_META`. O FGC: CDB, LCI e LCA têm cobertura pelo FGC conforme os limites vigentes; a poupança também; o Tesouro tem garantia do Tesouro Nacional. Coloque a fonte (site do FGC / Tesouro Direto).
- [ ] **Passo 4:** `npm test -- fixed-income`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(finance): comparador de renda fixa`.

---

### Tarefa 6: Tipos de dados, catálogo, provedor Demo e provedor BCB

**Arquivos:** Criar `src/lib/data/types.ts`, `src/lib/data/catalog.ts`, `src/lib/data/providers/demo.ts`, `src/lib/data/providers/bcb.ts`, `src/lib/data/providers/__fixtures__/bcb-*.json`, `src/lib/data/catalog.test.ts`, `src/lib/data/providers/demo.test.ts`, `src/lib/data/providers/bcb.test.ts`, `src/lib/logger.ts`

**Interfaces (produz):**
```ts
type DataSource = 'bcb' | 'brapi' | 'demo';
interface DataMeta { source: DataSource; isDemo: boolean; asOf: string; attribution: string }
type DataResult<T> = { status: 'ok'; data: T; meta: DataMeta } | { status: 'unavailable'; reason: 'fetch-failed'|'invalid-response'|'not-provided'|'empty'; source: DataSource; attribution: string };
type AssetClass = 'stock'|'fii'|'etf'|'crypto'|'index'|'currency';
interface Asset { ticker: string; slug: string; name: string; class: AssetClass; market: 'BR'|'US'|'CRYPTO'; currency: 'BRL'|'USD'; brapiSymbol?: string }
interface Quote { price: number; change: { day: number|null; week: number|null; month: number|null; year: number|null }; volume: number|null; dayHigh: number|null; dayLow: number|null; high52w: number|null; low52w: number|null }
interface PricePoint { date: string; close: number }
type HistoryRange = '1m'|'6m'|'1y';
interface Fundamentals { pl: number|null; pvp: number|null; roe: number|null; roic: number|null; netMargin: number|null; ebitdaMargin: number|null; netDebtToEbitda: number|null; dividendYield: number|null; payout: number|null; revenueCagr5y: number|null; earningsCagr5y: number|null }
type IndicatorId = 'selic'|'cdi'|'ipca12m'|'ipcaMonth'|'ptax'|'tr';
interface IndicatorValue { id: IndicatorId; value: number /* fração para taxas; BRL para ptax */; unit: 'a.a.'|'a.m.'|'BRL'; referenceDate: string }
interface MarketDataProvider {
  id: DataSource;
  getIndicator?(id: IndicatorId): Promise<DataResult<IndicatorValue>>;
  getQuote?(asset: Asset): Promise<DataResult<Quote>>;
  getHistory?(asset: Asset, range: HistoryRange): Promise<DataResult<PricePoint[]>>;
  getFundamentals?(asset: Asset): Promise<DataResult<Fundamentals>>;
}
// catalog.ts
export const CATALOG: readonly Asset[];
CLASS_ROUTES: Record<'acoes'|'fiis'|'etfs'|'cripto', AssetClass>;
getAsset(assetClass: AssetClass, slug: string): Asset | undefined
listByClass(assetClass: AssetClass): Asset[]
// demo.ts
createDemoProvider(opts?: { now?: () => Date }): MarketDataProvider   // sem getFundamentals e sem getIndicator
// bcb.ts
createBcbProvider(opts: { baseUrl: string; fetchImpl?: typeof fetch; now?: () => Date }): MarketDataProvider
BCB_SERIES: Record<IndicatorId, { code: number; unit: IndicatorValue['unit'] }>
// logger.ts
log(level: 'info'|'warn'|'error', event: string, fields?: Record<string, unknown>): void  // JSON numa linha; nunca recebe segredos
```
- **Catálogo:** os 16 itens da seção 9.3 do spec. Ibovespa, S&P 500, Nasdaq e Dow Jones têm `class: 'index'`. USD/BRL tem `class: 'currency'` e vem do indicador `ptax`. Nenhum preço no catálogo.
- **Demo:** preço base **100** para ações, FIIs, ETFs e cripto, e **10000** para índices. Esses valores são sabidamente fictícios. O histórico é um passeio aleatório diário com o gerador `mulberry32`, semeado pelo hash FNV-1a do ticker, com volatilidade diária de 1,5%. As variações saem do histórico. `meta = { source: 'demo', isDemo: true, asOf: now(), attribution: 'Dados demonstrativos gerados pela plataforma' }`.
- **BCB:** `GET {baseUrl}/dados/serie/bcdata.sgs.{code}/dados/ultimos/1?formato=json`, com `next: { revalidate: 3600 }` e timeout de 5 s. A resposta é validada com Zod: um array de `{ data: 'dd/MM/yyyy', valor: string }`. Valor em % é convertido para fração. `attribution: 'Banco Central do Brasil — SGS'`. Códigos iniciais a **conferir**: selic 432 (a.a.), cdi 4389 (a.a.), ipcaMonth 433 (a.m.), ipca12m 13522 (a.a.), ptax 1 (BRL), tr 226 (a.m.; conferir se a série é diária ou mensal e ajustar a unidade).

- [ ] **Passo 1:** grave as fixtures reais. Para cada código, rode `curl -s "https://api.bcb.gov.br/dados/serie/bcdata.sgs.<code>/dados/ultimos/1?formato=json"` e salve em `__fixtures__/bcb-<id>.json`. Confirme que cada série é o que o nome diz (pela descrição no SGS/BCB). Se algum código estiver errado, corrija `BCB_SERIES` e registre a correção para `API.md`.
- [ ] **Passo 2:** testes que falham:
  ```ts
  // catalog
  expect(CATALOG).toHaveLength(16); expect(getAsset('stock','petr4')?.ticker).toBe('PETR4'); expect(getAsset('fii','petr4')).toBeUndefined();
  expect(new Set(CATALOG.map(a => `${a.class}/${a.slug}`)).size).toBe(16);
  // demo
  const d = createDemoProvider({ now: () => new Date('2026-11-07T12:00:00Z') });
  const a = await d.getHistory!(petr4, '1y'); const b = await d.getHistory!(petr4, '1y');
  expect(a).toEqual(b); expect(a.status === 'ok' && a.meta.isDemo).toBe(true);
  expect((await d.getQuote!(petr4)).status === 'ok' && (await d.getQuote!(petr4) as any).meta.source).toBe('demo');
  expect(d.getFundamentals).toBeUndefined();
  // bcb
  const ok = createBcbProvider({ baseUrl: 'https://x', fetchImpl: fakeFetch(fixtureSelic) });
  const r = await ok.getIndicator!('selic');
  expect(r).toMatchObject({ status: 'ok', meta: { source: 'bcb', isDemo: false } }); expect(r.status==='ok' && r.data.value).toBeCloseTo(Number(fixtureSelic[0].valor)/100, 10);
  expect(await createBcbProvider({ baseUrl:'https://x', fetchImpl: fakeFetch([]) }).getIndicator!('selic')).toMatchObject({ status:'unavailable', reason:'empty' });
  expect(await createBcbProvider({ baseUrl:'https://x', fetchImpl: fakeFetch([{ data:'07/11/2026', valor:'' }]) }).getIndicator!('selic')).toMatchObject({ status:'unavailable', reason:'invalid-response' });
  expect(await createBcbProvider({ baseUrl:'https://x', fetchImpl: () => Promise.reject(new Error('down')) }).getIndicator!('selic')).toMatchObject({ status:'unavailable', reason:'fetch-failed' });
  ```
  Adicione um teste `it.skip`/`@live` que chama a API real (rodado à mão com `npm test -- bcb --run -t @live`).
- [ ] **Passo 3:** `npm test -- data`. Deve FALHAR.
- [ ] **Passo 4:** implemente. Toda falha chama `log('warn','provider.unavailable',{ provider, id, reason })`.
- [ ] **Passo 5:** `npm test -- data`. Deve PASSAR.
- [ ] **Passo 6:** commit `feat(data): tipos, catálogo, provedores demo e BCB`.

---

### Tarefa 7: Provedor brapi, env e serviço de dados

**Arquivos:** Criar `src/lib/config/env.ts`, `src/lib/data/providers/brapi.ts`, `src/lib/data/providers/__fixtures__/brapi-*.json`, `src/lib/data/service.ts`, `src/lib/data/index.ts`, testes `brapi.test.ts`, `service.test.ts`, `env.test.ts`

**Interfaces:**
- Consome: tipos e provedores da Tarefa 6.
- Produz:
  ```ts
  // env.ts (importa 'server-only'; para teste, exporte parseEnv)
  parseEnv(raw: Record<string, string|undefined>): Env;   type Env = { BRAPI_TOKEN?: string; BCB_BASE_URL: string };
  export const env: Env;
  // brapi.ts
  createBrapiProvider(opts: { token: string; fetchImpl?: typeof fetch; now?: () => Date }): MarketDataProvider   // getQuote, getHistory; getFundamentals só com campos que a resposta trouxer, o resto null
  // service.ts
  type MarketDataService = {
    getIndicator(id: IndicatorId): Promise<DataResult<IndicatorValue>>;
    getQuote(a: Asset): Promise<DataResult<Quote>>;
    getHistory(a: Asset, r: HistoryRange): Promise<DataResult<PricePoint[]>>;
    getFundamentals(a: Asset): Promise<DataResult<Fundamentals>>;
    providerFor(a: Asset): DataSource;
  };
  createMarketDataService(cfg: { env: Env; providers?: Partial<Record<DataSource, MarketDataProvider>> }): MarketDataService
  // index.ts (server-only)
  export const marketData: MarketDataService;
  ```
- **Regras de seleção** (seção 9.1 do spec):
  - indicadores vêm sempre do BCB;
  - `market === 'BR'` e classe stock, fii, etf ou index vêm da brapi se houver `BRAPI_TOKEN`, senão do demo;
  - US e CRYPTO vêm do demo.
  - **Sem fallback:** se o provedor escolhido não implementa o método, a resposta é `{ status: 'unavailable', reason: 'not-provided' }`. Uma falha do provedor real nunca troca para o demo.
- **brapi:** `GET https://brapi.dev/api/quote/{symbol}?range={1mo|6mo|1y}&interval=1d`, com o token no cabeçalho `Authorization: Bearer`, `revalidate: 900` e timeout de 5 s. Os campos do schema Zod devem ser **conferidos na documentação oficial da brapi** e numa resposta real (tickers de teste gratuitos, se ainda existirem). Mapeie `regularMarketPrice`, `regularMarketChangePercent`, `regularMarketVolume`, `regularMarketDayHigh`/`Low`, `fiftyTwoWeekHigh`/`Low` e `historicalDataPrice[{date (unix s), close}]`. Ajuste conforme a documentação. Registre em `API.md` os limites do plano gratuito.

- [ ] **Passo 1:** grave a fixture `brapi-petr4.json` de uma resposta real (ticker de teste sem token ou com token, se Fabio fornecer). Se não for possível, use o exemplo da documentação oficial e marque `"_origem": "documentação brapi, <URL>, <data>"`.
- [ ] **Passo 2:** testes que falham:
  ```ts
  expect(parseEnv({}).BCB_BASE_URL).toBe('https://api.bcb.gov.br'); expect(parseEnv({ BRAPI_TOKEN: '' }).BRAPI_TOKEN).toBeUndefined();
  const noToken = createMarketDataService({ env: parseEnv({}), providers: { bcb: fakeBcb, demo: createDemoProvider() } });
  expect(noToken.providerFor(petr4)).toBe('demo'); expect(noToken.providerFor(btc)).toBe('demo');
  const withToken = createMarketDataService({ env: parseEnv({ BRAPI_TOKEN: 't' }), providers: { bcb: fakeBcb, brapi: failingBrapi, demo: createDemoProvider() } });
  expect(withToken.providerFor(petr4)).toBe('brapi'); expect(withToken.providerFor(sp500)).toBe('demo');
  expect(await withToken.getQuote(petr4)).toMatchObject({ status: 'unavailable' });          // falha real NÃO vira demo
  expect(await noToken.getFundamentals(petr4)).toMatchObject({ status: 'unavailable', reason: 'not-provided' });
  // brapi com fixture
  const q = await createBrapiProvider({ token: 't', fetchImpl: fakeFetch(brapiFixture) }).getQuote!(petr4);
  expect(q).toMatchObject({ status: 'ok', meta: { source: 'brapi', isDemo: false } });
  expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/quote/PETR4'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer t' }) }));
  expect(await createBrapiProvider({ token:'t', fetchImpl: fakeFetch({ results: [{}] }) }).getQuote!(petr4)).toMatchObject({ status: 'unavailable', reason: 'invalid-response' });
  ```
- [ ] **Passo 3:** `npm test -- data env`. Deve FALHAR.
- [ ] **Passo 4:** implemente.
- [ ] **Passo 5:** `npm test`. Deve PASSAR.
- [ ] **Passo 6:** commit `feat(data): provedor brapi e serviço de dados`.

---

### Tarefa 8: Rotas de API, rate limit e cabeçalhos de segurança

**Arquivos:** Criar `src/lib/security/rate-limit.ts`, `src/lib/security/headers.ts`, `src/app/api/market/indicators/route.ts`, `src/app/api/market/quote/[ticker]/route.ts`, `src/app/api/market/history/[ticker]/route.ts`, `src/lib/security/*.test.ts`, `src/app/api/market/route-handlers.test.ts`, `docs/API.md`. Modificar `next.config.ts`.

**Interfaces:**
- Consome: `marketData`, `CATALOG`.
- Produz:
  ```ts
  createRateLimiter(opts: { limit: number; windowMs: number; now?: () => number }): { check(key: string): { ok: true } | { ok: false; retryAfterSec: number } }
  SECURITY_HEADERS: { key: string; value: string }[]   // usado em next.config headers() para '/(.*)'
  clientIp(req: Request): string                       // x-forwarded-for (1º) || 'unknown'
  ```
- **CSP**, exatamente a da seção 10.1 do spec: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`. Em `next dev`, adicione `'unsafe-eval'` ao script-src, **só** quando `NODE_ENV !== 'production'`.
- **Outros cabeçalhos:**
  - `X-Content-Type-Options: nosniff`;
  - `Referrer-Policy: strict-origin-when-cross-origin`;
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`;
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **Rotas:**
  - só GET, com o ticker validado por `z.string().regex(/^[A-Za-z0-9^.]{1,12}$/)`;
  - formato inválido → 400 `{ error: 'invalid-ticker' }`;
  - fora do catálogo → 404 `{ error: 'not-found' }`;
  - `range` fora de `1m|6m|1y` → 400;
  - limite estourado → 429 com `Retry-After`;
  - 200 → `DataResult<T>` em JSON, com `Cache-Control: public, s-maxage=900, stale-while-revalidate=3600`;
  - erro inesperado → 500 `{ error: 'internal' }`, sem stack.
  - O limitador é um singleton em memória por instância (limitação documentada em `API.md`).

- [ ] **Passo 1:** testes que falham:
  ```ts
  let t = 0; const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
  expect(rl.check('a').ok).toBe(true); expect(rl.check('a').ok).toBe(true); expect(rl.check('a')).toMatchObject({ ok: false, retryAfterSec: 1 });
  expect(rl.check('b').ok).toBe(true); t = 1000; expect(rl.check('a').ok).toBe(true);
  expect(SECURITY_HEADERS.find(h => h.key === 'Content-Security-Policy')!.value).toContain("frame-ancestors 'none'");
  // route handlers (importe GET e chame com new Request(...), mockando '@/lib/data' com vi.mock)
  expect((await quoteGET(req('/api/market/quote/%3Cscript%3E'), ctx('<script>'))).status).toBe(400);
  expect((await quoteGET(req('/api/market/quote/zzzz9'), ctx('zzzz9'))).status).toBe(404);
  expect((await quoteGET(req('/api/market/quote/petr4'), ctx('petr4'))).status).toBe(200);
  expect((await historyGET(req('/api/market/history/petr4?range=5y'), ctx('petr4'))).status).toBe(400);
  ```
  **Nota:** o spec pedia que `XXXX` desse 400. O plano refina: formato inválido → 400 e inexistente → 404.
- [ ] **Passo 2:** `npm test -- security route`. Deve FALHAR.
- [ ] **Passo 3:** implemente. Em `next.config.ts`, registre `headers()` com `SECURITY_HEADERS`, o `pageExtensions` com `mdx` e o `createMDX` (Tarefa 16; pode ficar para lá).
- [ ] **Passo 4:** `npm test` e `npm run build`. Deve PASSAR.
- [ ] **Passo 5:** escreva `docs/API.md`:
  - rotas internas (parâmetros, respostas, códigos, cache, limite);
  - fontes externas: BCB (séries conferidas na Tarefa 6), brapi (endpoint, autenticação, limites do plano gratuito, termos) e demo (como é gerado);
  - política "sem fallback".
- [ ] **Passo 6:** commit `feat(api): rotas de mercado, rate limit e cabeçalhos de segurança`.

---

### Tarefa 9: Design system — tokens, tema e primitivas de UI

**Arquivos:** Modificar `src/app/globals.css`, `src/app/layout.tsx`. Criar `src/components/theme-provider.tsx`, `src/components/ui/{Button,Card,Badge,Tooltip,Field,Input,Select,Table,Tabs,Skeleton,Modal,Dropdown}.tsx`, `src/components/ui/index.ts`, `src/components/ui/ui.test.tsx`

**Interfaces (produz):**
```ts
<Button variant?: 'primary'|'secondary'|'ghost' size?: 'sm'|'md' asChild?: never href?: string shine?: boolean />  // com href renderiza <Link>; `shine` = brilho do mockup (só no hero)
<Card as?: 'div'|'article'|'section' interactive?: boolean />
<Badge tone: 'demo'|'real'|'beginner'|'intermediate'|'advanced'|'neutral' />
<Tooltip content: ReactNode>{trigger}</Tooltip>          // abre com hover e foco, fecha com Esc, role="tooltip", aria-describedby
<Field label: string error?: string hint?: string>{(ids) => input}</Field>   // liga label/aria-describedby/aria-invalid
<Table caption: string columns: {key,label,align?}[] rows: Record<string,ReactNode>[] />
<Tabs items: {id,label,content}[] />                      // padrão WAI-ARIA tabs com setas
<Modal open onClose title>{children}</Modal>               // <dialog> nativo, foco preso, Esc fecha
<Dropdown label items: {label,href}[] />                  // menu do header, teclado
```
- **Tokens:** as variáveis de `:root` e `.dark` do spec (6.2), mapeadas com `@theme inline` do Tailwind v4 (`--color-bg`, `--color-surface`, `--color-surface-2`, `--color-text`, `--color-muted`, `--color-line`, `--color-accent`, `--color-up`, `--color-down`, `--color-hero`). Dark variant: `@custom-variant dark (&:where(.dark, .dark *));`. Fundo quadriculado de 28px do mockup no `body`. Bloco global com `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }`.
- **Tema:** `next-themes` com `attribute="class"`, `defaultTheme="system"`, `enableSystem` e `<html lang="pt-BR" suppressHydrationWarning>`.
- **Foco visível:** `outline` de 2px com `--color-accent` e offset de 2px em todos os interativos.

- [ ] **Passo 1:** testes que falham, `ui.test.tsx`:
  ```tsx
  render(<Field label="Capital inicial" error="Informe um valor">{(p) => <input {...p} />}</Field>);
  const input = screen.getByLabelText('Capital inicial'); expect(input).toHaveAttribute('aria-invalid','true'); expect(input).toHaveAccessibleDescription('Informe um valor');
  render(<Button href="/mercados">Explorar mercados</Button>); expect(screen.getByRole('link',{name:'Explorar mercados'})).toHaveAttribute('href','/mercados');
  render(<Tooltip content="Preço sobre lucro"><button>P/L</button></Tooltip>); await user.tab(); expect(screen.getByRole('tooltip')).toHaveTextContent('Preço sobre lucro'); await user.keyboard('{Escape}'); expect(screen.queryByRole('tooltip')).toBeNull();
  render(<Tabs items={[{id:'br',label:'Brasil',content:'A'},{id:'ex',label:'Exterior',content:'B'}]} />); await user.click(screen.getByRole('tab',{name:'Brasil'})); await user.keyboard('{ArrowRight}'); expect(screen.getByRole('tab',{name:'Exterior'})).toHaveAttribute('aria-selected','true');
  render(<Table caption="Ativos" columns={[{key:'t',label:'Ticker'}]} rows={[{t:'PETR4'}]} />); expect(screen.getByRole('table',{name:'Ativos'})).toBeInTheDocument();
  ```
- [ ] **Passo 2:** `npm test -- ui`. Deve FALHAR.
- [ ] **Passo 3:** implemente. Os estilos devem bater com `docs/design/mockup-home-v3.html`.
- [ ] **Passo 4:** `npm test -- ui` e `npm run build`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(ui): tokens, tema e primitivas acessíveis`.

---

### Tarefa 10: Layout global — header, navegação, rodapé, aviso

**Arquivos:** Criar `src/components/layout/{SkipLink,Header,MobileNav,ThemeToggle,Footer,Disclaimer,Breadcrumbs,PageHeader}.tsx`, `src/components/layout/layout.test.tsx`. Modificar `src/app/layout.tsx`.

**Interfaces:**
- Consome: `siteConfig`, primitivas da Tarefa 9.
- Produz:
  ```ts
  <Disclaimer variant?: 'footer'|'prominent' />        // texto exato das Restrições globais
  <Breadcrumbs items: { label: string; href?: string }[] />   // <nav aria-label="Trilha de navegação">; último item aria-current="page"
  <PageHeader eyebrow?: string title: string description?: string breadcrumbs?: ... />  // eyebrow renderizado como "// eyebrow" em mono; único <h1>
  ```
- **Header:** em vidro fosco sobre o topo escuro e `sticky`. Contém:
  - logo (link para `/`);
  - o `nav` do `siteConfig`, com "Investimentos" como `Dropdown`;
  - um botão de busca com o texto "Buscar ativo, tema…" e `aria-keyshortcuts="Control+K Meta+K"`, que dispara `window.dispatchEvent(new Event('open-search'))` (a Tarefa 17 escuta);
  - o `ThemeToggle`;
  - um "Mais" com o `userNav`;
  - o botão "Entrar", que leva a `/entrar`.

  Abaixo de 1024px, os links somem e aparece um botão `aria-expanded` que abre o `MobileNav` (gaveta com todos os itens, Esc fecha e o foco volta para o botão).
- **Footer:** colunas de links (Plataforma, Educação, Institucional: Sobre, Contato, Termos, Privacidade), o `<Disclaimer variant="footer"/>` e a atribuição: "Indicadores econômicos: Banco Central do Brasil (SGS). Cotações: brapi.dev, quando configurado; caso contrário, DADOS DEMONSTRATIVOS."
- **Topo escuro:** o `layout.tsx` não pinta o topo. Cada página decide; a Home usa o hero e as internas usam a faixa escura do `PageHeader`.

- [ ] **Passo 1:** testes que falham:
  ```tsx
  render(<Disclaimer />); expect(screen.getByText(/finalidade educacional e informativa/)).toHaveTextContent('Investimentos envolvem riscos.');
  render(<Breadcrumbs items={[{label:'Início',href:'/'},{label:'Ações',href:'/acoes'},{label:'PETR4'}]} />); expect(screen.getByText('PETR4')).toHaveAttribute('aria-current','page');
  render(<Header />); const btn = screen.getByRole('button',{name:/menu/i}); await user.click(btn); expect(btn).toHaveAttribute('aria-expanded','true'); await user.keyboard('{Escape}'); expect(btn).toHaveFocus();
  render(<ThemeProvider><ThemeToggle /></ThemeProvider>); expect(screen.getByRole('button',{name:/tema/i})).toBeInTheDocument();
  render(<PageHeader eyebrow="mercados" title="Mercados" />); expect(screen.getByRole('heading',{level:1,name:'Mercados'})).toBeInTheDocument(); expect(screen.getByText('// mercados')).toBeInTheDocument();
  ```
- [ ] **Passo 2:** `npm test -- layout`. Deve FALHAR.
- [ ] **Passo 3:** implemente. No `layout.tsx` entram `SkipLink` (alvo `#conteudo`), `Header`, `<main id="conteudo">` e `Footer`, além dos metadados base com o template `%s | Prisma`.
- [ ] **Passo 4:** `npm test -- layout`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(layout): header, navegação, rodapé e aviso`.

---

### Tarefa 11: Componentes de mercado

**Arquivos:** Criar `src/components/market/{DataSourceBadge,PriceChange,MetricCard,RangeBar,AssetCard,IndicatorStrip}.tsx`, `src/components/market/indicator-labels.ts`, `src/components/market/market.test.tsx`

**Interfaces:**
- Consome: `DataResult`, `DataMeta`, `Asset`, `Quote`, `IndicatorValue` (Tarefa 6); `format`.
- Produz:
  ```ts
  <DataSourceBadge meta: DataMeta />   // isDemo → Badge tone="demo" "DADOS DEMONSTRATIVOS"; senão tone="real" "Fonte: {attribution} · atualizado em {formatDateTime(asOf)}"
  <PriceChange value: number | null />  // ▲ +1,23% (--up) / ▼ -0,40% (--down) / "Dado não disponível"; nunca só cor
  <MetricCard label: string result: DataResult<number | null> | { status: 'not-applicable'; reason: string } format: 'percent'|'ratio'|'currency'|'number' help?: { text: string; href?: string } />
  <RangeBar low: number|null high: number|null current: number|null label: string />  // role="img" aria-label="Mínima X, máxima Y, atual Z"
  <AssetCard asset: Asset quote: DataResult<Quote> href: string />
  <IndicatorStrip groups: { results: DataResult<IndicatorValue | Quote>[]; labels: string[] }[] />  // agrupa por meta; selo por grupo
  INDICATOR_LABELS: Record<IndicatorId, string>   // selic "Selic", cdi "CDI", ipca12m "IPCA 12m", ipcaMonth "IPCA mês", ptax "Dólar PTAX", tr "TR"
  ```
- **Regra de tipo:** os componentes que mostram dado de mercado recebem `DataResult`, nunca um número solto. Com `status: 'unavailable'`, o texto é "Dado indisponível no momento" se `reason` for `fetch-failed`, `invalid-response` ou `empty`, e "Dado não disponível" se for `not-provided`.

- [ ] **Passo 1:** testes que falham:
  ```tsx
  render(<DataSourceBadge meta={{ source:'demo', isDemo:true, asOf:'2026-11-07T12:00:00Z', attribution:'x' }} />); expect(screen.getByText('DADOS DEMONSTRATIVOS')).toBeInTheDocument();
  render(<DataSourceBadge meta={{ source:'bcb', isDemo:false, asOf:'2026-11-07T12:00:00Z', attribution:'Banco Central do Brasil — SGS' }} />); expect(screen.getByText(/Banco Central do Brasil — SGS/)).toBeInTheDocument(); expect(screen.queryByText('DADOS DEMONSTRATIVOS')).toBeNull();
  render(<MetricCard label="P/L" result={{ status:'unavailable', reason:'not-provided', source:'demo', attribution:'x' }} format="ratio" />); expect(screen.getByText('Dado não disponível')).toBeInTheDocument();
  render(<MetricCard label="ROE" result={{ status:'ok', data:null, meta }} format="percent" />); expect(screen.getByText('Dado não disponível')).toBeInTheDocument();
  render(<MetricCard label="P/L" result={{ status:'not-applicable', reason:'A empresa teve prejuízo nos últimos 12 meses.' }} format="ratio" />); expect(screen.getByText('Não se aplica')).toBeInTheDocument();
  render(<MetricCard label="Selic" result={{ status:'unavailable', reason:'fetch-failed', source:'bcb', attribution:'x' }} format="percent" />); expect(screen.getByText('Dado indisponível no momento')).toBeInTheDocument();
  render(<PriceChange value={0.0123} />); expect(screen.getByText('▲ +1,23%')).toBeInTheDocument();
  render(<PriceChange value={-0.004} />); expect(screen.getByText('▼ -0,40%')).toBeInTheDocument();
  render(<PriceChange value={null} />); expect(screen.getByText('Dado não disponível')).toBeInTheDocument();
  ```
- [ ] **Passo 2:** `npm test -- market`. Deve FALHAR.
- [ ] **Passo 3:** implemente.
- [ ] **Passo 4:** `npm test -- market`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(market): componentes de dado com fonte obrigatória`.

---

### Tarefa 12: Home com ilustrações SVG animadas

**Arquivos:** Criar `src/components/illustrations/{HeroOrbit,GrowthBars}.tsx`, `src/components/illustrations/illustrations.css` (ou CSS module), `src/hooks/useInViewOnce.ts`, `src/lib/config/tools.ts`, `src/features/home/*.tsx`, `src/features/home/home.test.tsx`. Modificar `src/app/page.tsx`.

**Interfaces:**
- Consome: `marketData`, `CATALOG`, os componentes de mercado e de UI, `siteConfig`.
- Produz:
  ```ts
  TOOLS: { id: string; title: string; description: string; href: string; status: 'available'|'planned'; phase: 1|2|3; keywords: string[] }[]
  // 10 entradas = os simuladores do prompt original (juros compostos e comparador 'available'; aposentadoria, independência financeira, renda passiva, inflação, financiamento, amortização, dividendos, opções 'planned')
  useInViewOnce<T extends Element>(): [ref: RefObject<T>, inView: boolean]
  ```
- **Seções**, na ordem e com o conteúdo da seção 6.1 do spec:
  - hero com `HeroOrbit`: linha que se desenha, área com degradê e quatro chips orbitando, com animação em loop;
  - `IndicatorStrip` com dois grupos. O grupo BCB traz selic, cdi, ipca12m e ptax. O grupo de mercado traz Ibovespa, S&P 500 e BTC, via `marketData.getQuote`;
  - faixa de números calculada: classes de ativos `new Set(CATALOG.map(a=>a.class)).size`, simuladores `TOOLS.length`, trilhas `TRACKS.length`. A Tarefa 16 exporta `TRACKS`; até lá, use uma constante temporária e substitua;
  - destaques com 4 `AssetCard` (PETR4, MXRF11, BOVA11, BTC) e o card "Notícias, em breve";
  - ferramentas com o card do simulador (`GrowthBars`, animação **uma vez** ao entrar na tela) e o card do comparador;
  - três cards de trilha, com o link "Conhecer →" e sem barra de progresso;
  - vitrine do assistente: chat estático com o selo "Em breve" e a linha "Conteúdo educativo. Não é recomendação de investimento.";
  - CTA final.
- **Revalidação:** `export const revalidate = 900`.
- **SVG:** os decorativos levam `aria-hidden="true"`. O `HeroOrbit` leva `role="img"` e `aria-label="Ilustração: gráfico em alta com as classes de ativos ações, FIIs, renda fixa e cripto"`.

- [ ] **Passo 1:** testes que falham (`home.test.tsx`, renderizando as seções com dados fake e não a página async inteira):
  ```tsx
  expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Entenda o mercado. Analise seus investimentos. Tome decisões mais conscientes.');
  expect(screen.getByRole('link',{name:'Explorar mercados'})).toHaveAttribute('href','/mercados');
  expect(screen.getByRole('link',{name:'Conhecer ferramentas'})).toHaveAttribute('href','/ferramentas');
  // com quotes demo → selo aparece dentro do grupo de mercado
  expect(within(screen.getByTestId('strip-group-demo')).getByText('DADOS DEMONSTRATIVOS')).toBeInTheDocument();
  expect(screen.getByText(String(TOOLS.length))).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/garantid|melhor investimento|fique rico/i);
  ```
- [ ] **Passo 2:** `npm test -- home`. Deve FALHAR.
- [ ] **Passo 3:** implemente. As animações usam `stroke-dashoffset`, `transform` e `opacity`, e os keyframes ficam no CSS da ilustração, como no mockup.
- [ ] **Passo 4:** `npm test -- home` e `npm run build`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(home): página inicial com ilustrações animadas`.

---

### Tarefa 13: Mercados, listas por classe, página de ativo e páginas "em construção"

**Arquivos:** Criar `src/features/asset-page/{AssetPage,AssetHeader,FundamentalsSection,RiskSection,HistoryChart}.tsx`, `src/features/asset-page/fundamentals-meta.ts`, `src/features/asset-page/risk-texts.ts`, `src/components/charts/{LineChart,AreaChart,BarChart}.tsx`, `src/components/ComingSoon.tsx`, `src/app/mercados/page.tsx`, `src/app/{acoes,fiis,etfs,cripto}/page.tsx`, `src/app/{acoes,fiis,etfs,cripto}/[slug]/page.tsx`, `src/app/{renda-fixa,fundos,opcoes,carteira,analises,noticias,assistente,perfil,entrar}/page.tsx`, `src/app/{sobre,contato,termos,privacidade}/page.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`, `src/features/asset-page/asset-page.test.tsx`

**Interfaces:**
- Consome: `marketData`, `getAsset`, `listByClass`, `CLASS_ROUTES`, os componentes de mercado.
- Produz:
  ```ts
  <AssetPage asset: Asset quote: DataResult<Quote> history: Record<HistoryRange, DataResult<PricePoint[]>> fundamentals: DataResult<Fundamentals> />
  FUNDAMENTALS_META: { key: keyof Fundamentals; label: string; format: 'percent'|'ratio'; help: string; articleHref?: string }[]   // 11 campos, textos educativos curtos
  RISK_TEXTS: Record<'stock'|'fii'|'etf'|'crypto', string[]>   // riscos genéricos da CLASSE (nunca da empresa)
  <ComingSoon title: string phase: 2|3|4 description: string links?: { label: string; href: string }[] />
  <LineChart data title description /> etc.  // client, next/dynamic({ ssr:false }), com <table> sr-only equivalente
  ```
- **Rota de ativo** (`[slug]`):
  - `generateStaticParams` a partir de `listByClass`, com `dynamicParams = true` e `revalidate = 900`;
  - no corpo: se `slug !== slug.toLowerCase()`, `permanentRedirect` para a versão em minúsculas; se `getAsset` der `undefined`, `notFound()`;
  - `generateMetadata` com o título `"{TICKER} — {nome}"`.
- **Página de ativo**, conforme a seção 9.4 do spec:
  - `FundamentalsSection` só para stock e fii, com cada `MetricCard` e o `help` como tooltip;
  - quando `fundamentals` não for ok, todos os campos mostram o estado conforme a Tarefa 11;
  - um ativo atendido pela brapi nunca recebe seção demo;
  - dividendos, notícias e eventos aparecem como placeholders "Previsto na Fase 2";
  - `<Disclaimer variant="prominent"/>` no fim.
- **Mercados:** `Tabs` Brasil, Exterior e Cripto.
  - Cada aba tem uma `Table` com Ativo, Preço, Dia e Fonte (`DataSourceBadge` por linha).
  - Brasil inclui os indicadores do BCB.
  - As linhas "Juros futuros", "Treasuries", "Commodities" e "Dominância cripto" mostram "Dado não disponível — previsto na Fase 2".
- **"Em construção":** usam `ComingSoon` com a fase do roadmap. Opções e o assistente ficam na Fase 3; os demais na 2. `/renda-fixa` é um hub com texto educativo curto e links para o comparador e para o artigo de renda fixa.
- **Páginas legais:** o texto deixa claro que é um projeto de estudo e que não há coleta de dados pessoais. Cita a preferência de tema em `localStorage` e a ausência de cookies de rastreamento. `/contato` mostra apenas o link `siteConfig.links.github`.

- [ ] **Passo 1:** testes que falham:
  ```tsx
  render(<AssetPage asset={petr4} quote={demoQuote} history={demoHistories} fundamentals={{ status:'unavailable', reason:'not-provided', source:'demo', attribution:'x' }} />);
  expect(screen.getByRole('heading',{level:1})).toHaveTextContent('PETR4');
  expect(screen.getAllByText('Dado não disponível').length).toBeGreaterThanOrEqual(11);
  expect(screen.getAllByText('DADOS DEMONSTRATIVOS').length).toBeGreaterThan(0);
  expect(screen.getByText(/finalidade educacional/)).toBeInTheDocument();
  render(<AssetPage asset={btc} ... />); expect(screen.queryByRole('heading',{name:/Indicadores fundamentalistas/})).toBeNull();
  expect(Object.values(RISK_TEXTS).flat().join(' ')).not.toMatch(/compr[ae]|vend[ae]r|barat|car[oa]\b|oportunidade/i);
  ```
- [ ] **Passo 2:** `npm test -- asset-page`. Deve FALHAR.
- [ ] **Passo 3:** implemente todas as páginas da lista. Instale `recharts`.
- [ ] **Passo 4:** `npm test` e `npm run build`. Deve PASSAR. O build deve gerar as rotas estáticas do catálogo.
- [ ] **Passo 5:** commit `feat(pages): mercados, ativos, listas, em construção e legais`.

---

### Tarefa 14: Tela do simulador de juros compostos

**Arquivos:** Criar `src/features/compound-interest/{CompoundInterestForm,CompoundInterestResult,YearlyTable,url-state}.ts(x)`, `src/app/simuladores/page.tsx`, `src/app/simuladores/juros-compostos/page.tsx`, `src/features/compound-interest/compound-interest.test.tsx`

**Interfaces:**
- Consome: `compoundInterest`, `compoundInterestInputSchema`, `yearlySummary` (Tarefa 3), `parseBrNumber`, `formatCurrency`, `Field`, `AreaChart`, `TOOLS`.
- Produz:
  ```ts
  // url-state.ts
  toSearchParams(input: CompoundInterestInput): URLSearchParams      // capital, aporte, taxa (em % com vírgula? NÃO: número com ponto, ex. taxa=1.5), periodo=mes|ano, prazo, unidade=meses|anos
  fromSearchParams(sp: URLSearchParams): { values: FormValues; input: CompoundInterestInput | null }
  type FormValues = { capital: string; aporte: string; taxa: string; periodo: 'mes'|'ano'; prazo: string; unidade: 'meses'|'anos' }
  ```
- **Comportamento:**
  - os campos aceitam o formato brasileiro (`parseBrNumber`). Taxa e prazo são exibidos como digitados;
  - o cálculo é imediato, com debounce de 300 ms, e atualiza a URL com `router.replace` sem scroll;
  - os erros aparecem por campo (Zod, em pt-BR);
  - os resultados ficam numa região `aria-live="polite"`: patrimônio final, total investido e juros acumulados;
  - o gráfico de área é empilhado (investido × juros) e vem acompanhado de uma tabela anual expansível (`<details>`);
  - há a nota "Valores nominais, sem descontar a inflação. Aporte considerado no fim de cada mês." e o `<Disclaimer variant="prominent"/>`.
- `/simuladores` é um hub com cards de `TOOLS`. Os `planned` mostram o selo "Em breve" e a fase.

- [ ] **Passo 1:** testes que falham:
  ```tsx
  expect(fromSearchParams(toSearchParams(inp)).input).toEqual(inp);
  expect(fromSearchParams(new URLSearchParams('capital=abc')).input).toBeNull();
  render(<CompoundInterestForm initial={defaults} />);
  await user.clear(screen.getByLabelText('Capital inicial')); await user.type(screen.getByLabelText('Capital inicial'), '1.000,00');
  await user.clear(screen.getByLabelText('Aporte mensal')); await user.type(screen.getByLabelText('Aporte mensal'), '100');
  await user.clear(screen.getByLabelText('Taxa de juros')); await user.type(screen.getByLabelText('Taxa de juros'), '1');
  await user.selectOptions(screen.getByLabelText('Período da taxa'), 'mes');
  await user.clear(screen.getByLabelText('Prazo')); await user.type(screen.getByLabelText('Prazo'), '12');
  expect(await screen.findByTestId('final-balance')).toHaveTextContent('2.395,08');
  await user.clear(screen.getByLabelText('Prazo')); await user.type(screen.getByLabelText('Prazo'), 'abc');
  expect(screen.getByLabelText('Prazo')).toHaveAttribute('aria-invalid','true');
  expect(screen.queryByText(/NaN|Infinity/)).toBeNull();
  ```
- [ ] **Passo 2:** `npm test -- compound-interest`. Deve FALHAR.
- [ ] **Passo 3:** implemente. A página lê `searchParams` no servidor para os valores iniciais.
- [ ] **Passo 4:** `npm test -- compound-interest`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(simuladores): simulador de juros compostos`.

---

### Tarefa 15: Tela do comparador de renda fixa

**Arquivos:** Criar `src/features/fixed-income-comparator/{ComparatorForm,ComparatorTable,ComparatorChart}.tsx`, `src/app/ferramentas/page.tsx`, `src/app/ferramentas/comparador/page.tsx`, `src/features/fixed-income-comparator/comparator.test.tsx`

**Interfaces:**
- Consome: `compareFixedIncome`, `comparatorInputSchema`, `highestNet`, `PRODUCT_META`, `TAX_RULES`, `marketData.getIndicator('cdi'|'selic'|'tr')`, `parseBrNumber`.
- Produz: `<ComparatorForm rates: { cdi: DataResult<IndicatorValue>; selic: DataResult<IndicatorValue>; tr: DataResult<IndicatorValue> } rules: TaxRules />`
- **Taxas:**
  - quando as três estão ok, aparecem só para leitura, com `DataSourceBadge` e data;
  - quando qualquer uma está indisponível, surgem os campos "CDI (% a.a.)", "Selic meta (% a.a.)" e "TR (% a.m.)", com o selo neutro "Taxas informadas pelo usuário". A TR já vem preenchida com 0, junto do aviso "TR indisponível; considerada 0".
  - O usuário também pode trocar para as taxas manuais mesmo com dados reais.
- **Saída:**
  - `Table` com Produto, Bruto, Imposto, Custos, Líquido, Rentab. líquida no período, Equivalente a.a., Liquidez, Risco e FGC;
  - linhas `available: false` mostram o `reason` ocupando as colunas numéricas;
  - `BarChart` só com as linhas disponíveis;
  - a linha de `highestNet` recebe o Badge neutro "maior valor líquido nesta simulação";
  - premissas visíveis: dias úteis ≈ dias × 252/365; prazo mínimo de 30 dias, sem IOF; Tesouro Selic sem ágio/deságio; e "regras tributárias vigentes em {verifiedAt ou 'não verificadas'}".
- `/ferramentas` é um hub com o comparador e um link para `/simuladores`.

- [ ] **Passo 1:** testes que falham:
  ```tsx
  render(<ComparatorForm rates={{ cdi: unavailable, selic: unavailable, tr: unavailable }} rules={R} />);
  expect(screen.getByText('Taxas informadas pelo usuário')).toBeInTheDocument();
  await user.type(screen.getByLabelText('CDI (% a.a.)'), '10'); await user.type(screen.getByLabelText('Selic meta (% a.a.)'), '10,5');
  await user.clear(screen.getByLabelText('Valor')); await user.type(screen.getByLabelText('Valor'), '10.000');
  await user.clear(screen.getByLabelText('Prazo (dias)')); await user.type(screen.getByLabelText('Prazo (dias)'), '365');
  const row = await screen.findByRole('row', { name: /CDB/ }); expect(row).toHaveTextContent('10.825,00');
  expect(screen.getByText('maior valor líquido nesta simulação')).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/melhor investimento/i);
  await user.clear(screen.getByLabelText('Prazo (dias)')); await user.type(screen.getByLabelText('Prazo (dias)'), '29');
  expect(screen.getByLabelText('Prazo (dias)')).toHaveAttribute('aria-invalid','true');
  ```
- [ ] **Passo 2:** `npm test -- comparator`. Deve FALHAR.
- [ ] **Passo 3:** implemente.
- [ ] **Passo 4:** `npm test -- comparator`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(ferramentas): comparador de renda fixa`.

---

### Tarefa 16: Educação — MDX, trilhas e 9 artigos

**Arquivos:** Criar `mdx-components.tsx` (raiz), `content/educacao/{iniciante,intermediario,avancado}/*.mdx` (9 arquivos), `src/features/education/{registry.ts,TrackCard.tsx,ArticleLayout.tsx}`, `src/app/educacao/page.tsx`, `src/app/educacao/[trilha]/page.tsx`, `src/app/educacao/[trilha]/[artigo]/page.tsx`, `src/features/education/education.test.ts`. Modificar `next.config.ts` (`createMDX`, `pageExtensions`).

**Interfaces (produz):**
```ts
// cada .mdx exporta:  export const meta = { title, description, level: 'iniciante'|'intermediario'|'avancado', readingMinutes, updatedAt: 'YYYY-MM-DD', terms: string[], relatedTools: string[] /* ids de TOOLS */ }
articleMetaSchema: z.ZodType<ArticleMeta>
TRACKS: { slug: 'iniciante'|'intermediario'|'avancado'; title: string; description: string; articles: string[] /* slugs em ordem */ }[]
listArticles(): Promise<(ArticleMeta & { track: string; slug: string })[]>      // importa cada mdx via import dinâmico estático (mapa explícito), valida meta com Zod
loadArticle(track: string, slug: string): Promise<{ meta: ArticleMeta; Content: ComponentType } | null>
```
- **Biblioteca:** `@next/mdx` com `@mdx-js/loader`, `@mdx-js/react` e `@types/mdx`. O registro usa um **mapa explícito** de imports (`{ 'iniciante/juros-compostos-e-inflacao': () => import('@/../content/...') }`) para que o bundler resolva os arquivos. A rota `[artigo]` gera os parâmetros a partir de `TRACKS` e usa `dynamicParams = false`.
- **Artigos** (slugs): iniciante: `juros-compostos-e-inflacao`, `risco-retorno-e-liquidez`, `renda-fixa-basica`; intermediario: `indicadores-fundamentalistas`, `fiis`, `etfs-e-diversificacao`; avancado: `introducao-a-opcoes`, `volatilidade-e-gregas`, `gestao-de-risco`.
  - Textos **originais**, de 600 a 1200 palavras, com exemplos numéricos hipotéticos marcados como tal.
  - Seguem as skills: os de indicadores usam as definições da `financial-analysis`; os de opções seguem a `options-analysis`, com o risco antes do ganho e sem recomendação.
  - Cada artigo termina com links para os `relatedTools` e o `<Disclaimer variant="prominent"/>`, inserido pelo `ArticleLayout`.
- **Glossário para tooltips:** os `terms` alimentam `FUNDAMENTALS_META.articleHref` (Tarefa 13). Ajuste lá para apontar para `/educacao/intermediario/indicadores-fundamentalistas`.

- [ ] **Passo 1:** testes que falham, `education.test.ts`:
  ```ts
  const all = await listArticles(); expect(all).toHaveLength(9);
  expect(TRACKS.map(t => t.articles.length)).toEqual([3,3,3]);
  all.forEach(a => expect(articleMetaSchema.safeParse(a).success).toBe(true));
  all.forEach(a => a.relatedTools.forEach(id => expect(TOOLS.some(t => t.id === id)).toBe(true)));
  expect(await loadArticle('iniciante','nao-existe')).toBeNull();
  ```
  Teste de linguagem: leia os arquivos `.mdx` com `fs` e verifique `not.toMatch(/\b(compre|venda agora|garantid[oa]|melhor investimento|fique rico)\b/i)`.
- [ ] **Passo 2:** `npm test -- education`. Deve FALHAR.
- [ ] **Passo 3:** configure o MDX, escreva o registro, as páginas e os 9 artigos.
- [ ] **Passo 4:** `npm test -- education` e `npm run build`. Deve PASSAR.
- [ ] **Passo 5:** substitua a constante temporária de trilhas da Home (Tarefa 12) por `TRACKS.length` e rode `npm test`.
- [ ] **Passo 6:** commit `feat(educacao): trilhas e artigos em MDX`.

---

### Tarefa 17: Busca global (Ctrl/⌘+K e /busca)

**Arquivos:** Criar `src/lib/search/{normalize,build-index,search}.ts`, `src/components/search/{SearchDialog,SearchResults}.tsx`, `src/app/busca/page.tsx`, `src/lib/search/search.test.ts`, `src/components/search/search-dialog.test.tsx`. Modificar `src/app/layout.tsx` (montar `SearchDialog` via `next/dynamic`).

**Interfaces:**
- Consome: `CATALOG`, `listArticles`, `TOOLS`, `siteConfig.nav`.
- Produz:
  ```ts
  type SearchEntry = { type: 'asset'|'article'|'tool'|'page'; title: string; subtitle?: string; href: string; keywords: string[] };
  normalize(s: string): string                                   // NFD, sem diacríticos, minúsculas, trim
  buildSearchIndex(): Promise<SearchEntry[]>                     // roda no servidor
  search(query: string, index: SearchEntry[], limit?: number): SearchEntry[]   // padrão 8
  ```
- **Pontuação:** ticker ou título exato = 100; começa com = 50; contém no título = 20; contém em keywords ou subtitle = 10. O empate é desfeito pela ordem do tipo (asset, tool, article, page). Query vazia → `[]`.
- **Entrega do índice:** gerado no build pela rota `src/app/search-index.json/route.ts` (`dynamic = 'force-static'`). O diálogo faz `fetch('/search-index.json')` na primeira abertura.
- **Diálogo:**
  - abre com Ctrl+K ou ⌘+K **exceto** quando o foco está num `input`, `textarea` ou `[contenteditable]` com texto, e também com o evento `open-search` vindo do Header;
  - usa `Modal`, com resultados agrupados por tipo e o padrão `role="combobox"`/`listbox`;
  - setas navegam, Enter abre e Esc fecha.
- **`/busca?q=`:** renderizada no servidor com o mesmo `search`. Recebe `robots: { index: false }` se `q` estiver vazio.

- [ ] **Passo 1:** testes que falham:
  ```ts
  expect(normalize('  Ações ')).toBe('acoes');
  const idx = await buildSearchIndex();
  expect(search('petr4', idx)[0]).toMatchObject({ type: 'asset', href: '/acoes/petr4' });
  expect(search('PETR', idx)[0]!.href).toBe('/acoes/petr4');
  expect(search('inflacao', idx).some(e => e.href === '/educacao/iniciante/juros-compostos-e-inflacao')).toBe(true);
  expect(search('juros', idx).some(e => e.href === '/simuladores/juros-compostos')).toBe(true);
  expect(search('', idx)).toEqual([]);
  ```
  ```tsx
  render(<SearchDialog index={idx} />); await user.keyboard('{Control>}k{/Control}'); expect(screen.getByRole('dialog')).toBeInTheDocument();
  await user.type(screen.getByRole('combobox'), 'petr4'); await user.keyboard('{ArrowDown}'); expect(screen.getByRole('option',{name:/PETR4/})).toHaveAttribute('aria-selected','true');
  await user.keyboard('{Escape}'); expect(screen.queryByRole('dialog')).toBeNull();
  ```
- [ ] **Passo 2:** `npm test -- search`. Deve FALHAR.
- [ ] **Passo 3:** implemente.
- [ ] **Passo 4:** `npm test -- search` e `npm run build`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(busca): busca global com atalho e página /busca`.

---

### Tarefa 18: SEO — metadata, sitemap, robots, JSON-LD e Open Graph

**Arquivos:** Criar `src/lib/seo/{metadata,json-ld}.ts`, `src/components/JsonLd.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/opengraph-image.tsx`, `src/lib/seo/seo.test.ts`. Modificar as páginas para usar `buildMetadata`.

**Interfaces (produz):**
```ts
buildMetadata(opts: { title: string; description: string; path: string; type?: 'website'|'article' }): Metadata   // canonical = siteConfig.url + path; openGraph + twitter
websiteJsonLd(): object        // WebSite + potentialAction SearchAction → /busca?q={search_term_string}
articleJsonLd(meta: ArticleMeta, path: string): object
breadcrumbJsonLd(items: { label: string; href: string }[]): object
<JsonLd data: object />        // <script type="application/ld+json"> com JSON.stringify(data).replace(/</g,'\\u003c')
```
- **Sitemap:** todas as rotas da seção 4.2 do spec, mais os ativos do catálogo (exceto index e currency) e os 9 artigos. Exclui `/busca` e `/entrar`.
- **robots:** `allow: '/'`, `disallow: ['/api/']` e `sitemap: siteConfig.url + '/sitemap.xml'`.
- **OG image:** padrão 1200×630 com o nome, o H1 e as cores do hero (`ImageResponse`).

- [ ] **Passo 1:** testes que falham:
  ```ts
  const m = buildMetadata({ title:'Mercados', description:'d', path:'/mercados' }); expect(m.alternates?.canonical).toBe(`${siteConfig.url}/mercados`);
  const urls = (await sitemap()).map(e => e.url);
  expect(urls).toEqual(expect.arrayContaining([`${siteConfig.url}/acoes/petr4`, `${siteConfig.url}/educacao/avancado/introducao-a-opcoes`, `${siteConfig.url}/simuladores/juros-compostos`]));
  expect(urls.some(u => u.includes('/api/'))).toBe(false);
  render(<JsonLd data={{ name: '</script><script>alert(1)</script>' }} />); expect(document.querySelector('script[type="application/ld+json"]')!.innerHTML).not.toContain('</script><script>');
  ```
- [ ] **Passo 2:** `npm test -- seo`. Deve FALHAR.
- [ ] **Passo 3:** implemente e aplique `buildMetadata` e `generateMetadata` em todas as páginas. A Home recebe `websiteJsonLd`; os artigos, `articleJsonLd`; as páginas internas, `breadcrumbJsonLd`.
- [ ] **Passo 4:** `npm test` e `npm run build`. Deve PASSAR.
- [ ] **Passo 5:** commit `feat(seo): metadata, sitemap, robots, JSON-LD e OG`.

---

### Tarefa 19: Testes E2E — navegação, celular, acessibilidade e segurança

**Arquivos:** Criar `tests/e2e/{routes,navigation,search,simulator,comparator,theme,responsive,a11y,security,demo-labels,reduced-motion}.spec.ts`, `tests/e2e/routes.ts` (lista única das rotas)

**Interfaces:** consome as rotas do app. O `webServer` sobe com `BCB_BASE_URL=http://127.0.0.1:9` e sem `BRAPI_TOKEN` (Tarefa 1), então o BCB fica indisponível e o resto é demo, de forma determinística.

- [ ] **Passo 1:** escreva os testes, cada um rodando nos projetos `desktop` e `mobile`:
  - `routes`: cada rota da seção 4.2 do spec responde 200 e tem exatamente um `h1`. `/acoes/nao-existe` → 404. `/fiis/petr4` → 404. `/acoes/PETR4` termina em `/acoes/petr4` (Review Focus 3).
  - `navigation`: no projeto mobile, abrir o menu, clicar em "Mercados" e ver a URL `/mercados`. No desktop, abrir o dropdown "Investimentos" e chegar a "Ações".
  - `search`: `Control+k` (desktop) → digitar "PETR4" → Enter → `/acoes/petr4`. Também "inflação" → ver o artigo de juros compostos.
  - `simulator`: abrir `/simuladores/juros-compostos?capital=1000&aporte=100&taxa=1&periodo=mes&prazo=12&unidade=meses` → ver "2.395,08". Alterar o prazo para 24 → a URL contém `prazo=24`. Digitar "1.000,50" no capital → nenhum "NaN" (Review Focus 1).
  - `comparator`: com o BCB indisponível, ver "Taxas informadas pelo usuário", preencher CDI 10, Selic 10,5, Valor 10.000 e Prazo 365 → a linha CDB contém "10.825,00" (Review Focus 2).
  - `theme`: clicar no alternador → `html` tem a classe `dark` → recarregar → a classe continua lá.
  - `responsive`: em 375px, para `/`, `/mercados`, `/acoes/petr4`, `/simuladores/juros-compostos`, `/ferramentas/comparador` e `/educacao`: `document.documentElement.scrollWidth <= window.innerWidth`.
  - `a11y`: `AxeBuilder` nas mesmas páginas, sem violações `serious` ou `critical`, nos dois temas.
  - `security`: os cabeçalhos `content-security-policy` (contendo `frame-ancestors 'none'`), `x-content-type-options` e `referrer-policy` estão presentes em `/`. `GET /api/market/quote/%3Cscript%3E` → 400. `/api/market/quote/zzzz9` → 404. 61 requisições seguidas a `/api/market/indicators` → a última é 429.
  - `demo-labels`: na Home, cada elemento `[data-demo-value]` tem um ancestral `[data-source-group]` que contém o texto "DADOS DEMONSTRATIVOS". Adicione esses atributos no `IndicatorStrip` e no `AssetCard`, na Tarefa 11 ou aqui.
  - `reduced-motion`: com `page.emulateMedia({ reducedMotion: 'reduce' })` em `/`, todo `svg *` tem o `animation-name` computado igual a `none` (Review Focus 5).
- [ ] **Passo 2:** `npx playwright install chromium` e `npm run test:e2e`. Os testes que falharem indicam ajustes no app. Corrija no app, não no teste, salvo se o teste contrariar o spec.
- [ ] **Passo 3:** rode `npm run test:e2e` até tudo PASSAR nos dois projetos.
- [ ] **Passo 4:** commit `test(e2e): navegação, celular, acessibilidade e segurança`.

---

### Tarefa 20: Documentação, Lighthouse e preparação para deploy

**Arquivos:** Criar `README.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/DATABASE.md`. Modificar `CLAUDE.md` (lista de skills e comandos finais) e `src/lib/config/features.ts` (registro de planos). Criar `src/lib/config/features.test.ts`.

**Interfaces (produz):**
```ts
type Plan = 'free'|'premium'|'pro';
FEATURES: Record<string, { label: string; minPlan: Plan }>   // conforme seção 37 do prompt: notícias/conteúdo/indicadores/simuladores básicos = free; análises avançadas/carteira/alertas/screener/opções/relatórios = premium; APIs/recursos para analistas = pro
canAccess(feature: keyof typeof FEATURES, user?: { plan: Plan }): boolean   // MVP: sempre true
```

- [ ] **Passo 1:** teste que falha: `expect(Object.keys(FEATURES).every(f => canAccess(f))).toBe(true)`. Rode e veja falhar, implemente e veja passar.
- [ ] **Passo 2:** escreva os documentos.
  - **`README.md`:**
    - o que é, com o aviso padrão;
    - prints da Home nos modos claro e escuro (capturados com Playwright e salvos em `docs/images/`);
    - como rodar (`npm install`, `cp .env.example .env.local`, `npm run dev`);
    - variáveis de ambiente, scripts e como testar;
    - passo a passo de publicação: criar o repositório no GitHub, importar na Vercel, configurar `BRAPI_TOKEN` (opcional) e `NEXT_PUBLIC_SITE_URL`;
    - limitações conhecidas.
  - **`docs/ARCHITECTURE.md`:** camadas, fluxo do `DataResult`/`DataMeta` e as definições canônicas de indicadores da skill financial-analysis. ADRs curtos:
    1. Next.js em vez de Astro;
    2. sem banco no MVP;
    3. sem fallback para demo;
    4. CSP sem nonce;
    5. convenção diária para % do CDI;
    6. rate limit em memória;
    7. ativo brapi nunca mistura demo;
    8. índice de busca estático.
  - **`docs/ROADMAP.md`:** a seção 12 do spec, com o MVP marcado como concluído e as pendências encontradas na execução.
  - **`docs/DATABASE.md`:** "sem banco no MVP", mais o esquema da Fase 2 (tabelas da seção 11.2 do spec, com colunas, chaves, índices e as notas de LGPD sobre retenção e exclusão de conta).
  - **`CLAUDE.md`:** comandos finais e a seção "Skills do projeto", listando as skills de `.claude/skills/` com uma linha cada.
- [ ] **Passo 3:** Lighthouse em `npm run build && npm run start`, com `npx lighthouse http://localhost:3000/<rota> --form-factor=mobile --only-categories=performance,accessibility,seo,best-practices --output=json` para `/`, `/acoes/petr4` e `/simuladores/juros-compostos`. As metas são Performance ≥ 90 e as demais ≥ 95. Registre as notas no README. Se alguma meta falhar, corrija ou registre a causa como limitação.
- [ ] **Passo 4:** verificação final: `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`. Tudo deve PASSAR.
- [ ] **Passo 5:** commit `docs: README, arquitetura, roadmap, API, banco e notas de Lighthouse`.

---

## Relatório por etapa (exigência do Fabio)

Ao final de cada tarefa, relate em português:
- o que foi criado;
- os arquivos alterados;
- como testar (o comando);
- as limitações;
- o próximo passo.

Agrupe as tarefas nestas etapas de relatório:
- **Etapa A:** Tarefas 1 a 5 (fundação e cálculos).
- **Etapa B:** Tarefas 6 a 8 (dados e API).
- **Etapa C:** Tarefas 9 a 13 (interface e páginas).
- **Etapa D:** Tarefas 14 a 17 (ferramentas, educação e busca).
- **Etapa E:** Tarefas 18 a 20 (SEO, E2E e documentação).
