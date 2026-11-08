# Fase 2A: simuladores — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** inflação ("em reais de hoje") nos dois simuladores existentes, mais três simuladores novos: inflação, aposentadoria/independência financeira e financiamento SAC × Price.

**Arquitetura:** a matemática fica em funções puras em `src/lib/finance` (TDD). O histórico do IPCA entra na camada de dados (`src/lib/data`, provedor BCB). As páginas são Server Components que buscam os dados e entregam a formulários cliente, com o estado na URL no padrão de `src/features/compound-interest/url-state.ts`.

**Stack:** a mesma do MVP (Next.js 16 App Router, React 19, TypeScript estrito, Tailwind 4, Zod, Recharts, Vitest, Playwright + axe).

**Spec:** `docs/superpowers/specs/2026-11-08-fase2a-simuladores-design.md` (e o spec do MVP, `docs/superpowers/specs/2026-11-07-plataforma-investimentos-design.md`, no que este não muda).

## Restrições globais

- Interface, conteúdo e documentação em português do Brasil; identificadores em inglês.
- Textos exatos do projeto: "Dado indisponível no momento", "Dado não disponível", "DADOS DEMONSTRATIVOS". Para destaque, só "maior valor líquido nesta simulação".
- Proibido: "compre/venda", "melhor investimento", "garanta", "renda garantida", "você vai se aposentar com" e qualquer promessa de retorno.
- Toda premissa (inflação futura, rentabilidade real) é rotulada "premissa, não previsão". O valor padrão vem de dado real citado, com fonte e referência.
- Números entram por `parseBrNumber` e saem por `src/lib/format` (Intl pt-BR). Nunca exibir `NaN`, `Infinity` ou `undefined`.
- `src/lib/finance` não faz I/O; o "hoje" chega como parâmetro.
- A UI nunca chama APIs externas: tudo passa por `marketData` (`src/lib/data`).
- Fonte real que falha → "Dado indisponível no momento", sem dado demonstrativo no lugar.
- `Disclaimer variant="prominent"` em cada página de simulador; `buildMetadata` em cada página nova.
- Sem rolagem horizontal em 375 px; contraste AA nos dois temas; o axe sem violações graves.
- Nunca enfraquecer um teste existente para ele passar: corrija o app.
- Um commit por tarefa (ou mais), terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Verificação de cada tarefa: `npm run lint && npm run typecheck && npm test`; as tarefas com página também rodam `npx playwright test <arquivo>`. O E2E roda com o BCB inacessível de propósito (`BCB_BASE_URL=http://127.0.0.1:9`).

## Foco da revisão

1. **Entrada pt-BR:** "1.234,56", "4,5", campo vazio, "-" e espaços em todos os campos novos. Erro de campo claro, nunca `NaN`.
2. **Inflação vazia, zero ou negativa (deflação):** vazia desliga a parte real; zero dá "em reais de hoje" igual ao nominal; −2% funciona. O limite é de −50% a 100% a.a.
3. **Limites de mês na correção pelo IPCA:** início = fim (fator 1); início em 07/1994; fim = último mês publicado; fim antes do início; mês fora da série; buraco na série.
4. **Financiamento extremo:** taxa 0; prazo 1; extra tão grande que quita no 1º mês; extra que deixaria saldo negativo; 420 meses a 2% a.m.
5. **Aposentadoria extrema:** rentabilidade real 0; patrimônio atual já suficiente; idade-alvo ≤ idade atual; meta não atingida em 100 anos; aporte 0 com patrimônio 0.

---

### Tarefa 1: histórico mensal do IPCA na camada de dados

**Arquivos:**
- Modificar: `src/lib/data/types.ts`, `src/lib/data/providers/bcb.ts`, `src/lib/data/service.ts`
- Criar: `src/lib/data/providers/__fixtures__/bcb-ipca-history.json` (resposta real gravada da série 433, de 01/2024 a 12/2024)
- Testes: `src/lib/data/providers/bcb.test.ts`, `src/lib/data/service.test.ts`

**Interfaces:**
- Produz, em `types.ts`:
  - `export interface MonthlyPoint { month: string /* YYYY-MM */; value: number /* fração: 0,0042 = 0,42% */ }`
  - Em `MarketDataProvider`: `getIndicatorHistory?(id: 'ipcaMonth', fromMonth: string): Promise<DataResult<MonthlyPoint[]>>`
- Produz, em `MarketDataService`: `getIndicatorHistory(id: 'ipcaMonth', fromMonth: string): Promise<DataResult<MonthlyPoint[]>>`, que delega ao provedor `bcb` ou devolve `not-provided`.
- Comportamento no BCB:
  - Consulta `.../bcdata.sgs.433/dados?formato=json&dataInicial=01/MM/AAAA&dataFinal=<hoje dd/MM/aaaa>` em **blocos de no máximo 10 anos** (vários fetches em paralelo, concatenados em ordem e sem meses duplicados).
  - Usa `next: { revalidate: 86400 }` e timeout de 10 s.
  - Valida com o mesmo `responseSchema`.
  - `value` = valor ÷ 100.
  - Qualquer bloco que falhe faz o resultado inteiro ficar `unavailable`.

- [ ] **Passo 1:** grave a fixture: `curl -s "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01/01/2024&dataFinal=31/12/2024"`.
- [ ] **Passo 2:** escreva os testes, que devem falhar:
  - `getIndicatorHistory('ipcaMonth','2024-01')` com a fixture devolve 12 pontos; o primeiro é `{ month: '2024-01', value: Number(fixture[0].valor)/100 }`.
  - Com `now` = 2026-11-07 e `fromMonth` = `'1994-07'`, faz 4 chamadas cujas `dataInicial`/`dataFinal` cobrem 01/07/1994 até 07/11/2026 sem sobreposição (blocos de 10 anos). Confira as URLs exatas.
  - Um bloco com HTTP 500 dá `unavailable`/`fetch-failed`.
  - Um corpo inválido dá `invalid-response`.
  - No serviço: sem provedor `bcb` → `not-provided`.
- [ ] **Passo 3:** implemente e rode `npx vitest run src/lib/data`, que deve passar.
- [ ] **Passo 4:** commit `feat(data): histórico mensal do IPCA (BCB SGS 433)`.

### Tarefa 2: funções de inflação

**Arquivos:**
- Criar: `src/lib/finance/inflation.ts` e `src/lib/finance/inflation.test.ts`

**Interfaces:**
- Consome: `MonthlyPoint` (Tarefa 1).
- Produz:
  - `export const REAL_START_MONTH = '1994-07'`
  - `export const INFLATION_MIN = -0.5` e `export const INFLATION_MAX = 1` (fração anual)
  - `toPresentValue(value: number, annualInflation: number, years: number): number`, que calcula `value / (1+inf)^years`
  - `realRate(nominal: number, inflation: number): number`, que calcula `(1+n)/(1+i) − 1`
  - `correctByIpca(series: MonthlyPoint[], amount: number, from: string, to: string): CorrectionResult`, onde
    `type CorrectionResult = { ok: true; corrected: number; factor: number; accumulated: number; months: number } | { ok: false; error: 'order' | 'range' | 'missing' }`
    - O fator é o produto de `(1+v)` dos meses `m` com `from < m ≤ to`.
    - `from > to` → `'order'`.
    - `from < REAL_START_MONTH` ou `to` depois do último mês da série → `'range'`.
    - Algum mês do intervalo ausente → `'missing'`.
    - `accumulated` = `factor − 1`; `months` = número de meses multiplicados.
  - `purchasingPower(amount: number, annualInflation: number, years: number): { neededInFuture: number; todayEquivalent: number }`, que calcula `amount·(1+i)^y` e `amount/(1+i)^y`

- [ ] **Passo 1:** testes que falham:
  - `toPresentValue(110, 0.1, 1)` = 100.
  - `realRate(0.1, 0.04)` ≈ 0,0576923.
  - `toPresentValue(100, 0, 5)` = 100.
  - Deflação: `toPresentValue(98, -0.02, 1)` = 100.
  - `correctByIpca` com os 12 meses da fixture de 2024:
    - de `'2024-01'` a `'2024-04'` → fator = (1+fev)(1+mar)(1+abr), calculado no teste a partir da fixture;
    - de `'2024-03'` a `'2024-03'` → fator 1 e `months` 0;
    - de `'2024-05'` a `'2024-02'` → `'order'`;
    - de `'2024-01'` a `'2025-01'` → `'range'`;
    - série com um mês removido → `'missing'`;
    - `from` `'1994-06'` → `'range'`.
  - `purchasingPower(1000, 0.05, 2)` → 1102,50 e ≈ 907,03.
- [ ] **Passo 2:** implemente; `npx vitest run src/lib/finance/inflation.test.ts` deve passar.
- [ ] **Passo 3:** commit `feat(finance): correção pelo IPCA, valor presente e taxa real`.

### Tarefa 3: inflação no simulador de juros compostos

**Arquivos:**
- Criar: `src/features/simulators-shared/inflation-default.ts` e o teste correspondente
- Modificar: `src/features/compound-interest/url-state.ts`, `CompoundInterestForm.tsx`, `CompoundInterestResult.tsx`, `YearlyTable.tsx`, `compound-interest.test.tsx`; `src/app/simuladores/juros-compostos/page.tsx`

**Interfaces:**
- Consome: `toPresentValue`, `realRate`, `INFLATION_MIN/MAX` (Tarefa 2); `marketData.getIndicator('ipca12m')`; `referenceLabel` de `src/components/market/indicator-labels.ts`.
- Produz `inflationDefault(r: DataResult<IndicatorValue>): { percent: string; note: string } | null`:
  - para `ok`, `percent` é o valor em % com 2 casas no formato pt-BR (ex.: `'4,58'`) e `note` é `` `IPCA 12 meses, ${referenceLabel(...)} (premissa, não previsão)` ``;
  - para `unavailable`, devolve `null`.
  - As Tarefas 4, 5 e 7 usam esta mesma função.
- Na URL: o parâmetro novo `inflacao` (texto pt-BR, como os outros).
  - Ausente → usa o padrão `inflationDefault`.
  - `inflacao=` (vazio) → desliga a parte real.
  - `FormValues.inflacao: string`.
  - A validação devolve `input` mais `inflation: number | null` (fração), com erro "Informe uma inflação entre -50% e 100% a.a." fora do limite.

- [ ] **Passo 1:** testes que falham:
  - `inflationDefault` em ok (`ipca12m` 0,0458, ref 2026-09-01) dá `{ percent: '4,58', note: 'IPCA 12 meses, ref. 09/2026 (premissa, não previsão)' }`; em unavailable dá `null`.
  - O formulário com inflação 10% e o caso padrão (R$ 1.000 + R$ 100 por mês, 1% a.m., 12 meses) mostra "Valor final em reais de hoje" = saldo ÷ 1,1, formatado.
  - A taxa real anual é exibida.
  - A tabela anual tem a coluna "Em reais de hoje".
  - Inflação vazia: a seção real não é renderizada.
  - `inflacao=abc`: erro no campo e nenhum `NaN` na tela.
  - Sem padrão (BCB indisponível) e sem parâmetro: campo vazio, seção real ausente e a nota "IPCA indisponível no momento; informe uma premissa se quiser ver o valor em reais de hoje".
- [ ] **Passo 2:** implemente. A página busca `ipca12m` no servidor e passa `inflationDefault` ao formulário.
- [ ] **Passo 3:** `npm test` e `npx playwright test tests/e2e/simulator.spec.ts` (os testes existentes continuam passando). Acrescente ao `simulator.spec.ts` o teste "inflação informada mostra valor em reais de hoje": preencher 10 e conferir o texto.
- [ ] **Passo 4:** commit `feat(juros-compostos): valor em reais de hoje com premissa de inflação`.

### Tarefa 4: inflação no comparador de renda fixa

**Arquivos:**
- Modificar: `src/features/fixed-income-comparator/ComparatorForm.tsx`, `ComparatorTable.tsx`, `comparator.test.tsx`; `src/app/ferramentas/comparador/page.tsx`; `tests/e2e/comparator.spec.ts`

**Interfaces:**
- Consome: `inflationDefault` (Tarefa 3), `toPresentValue`, `realRate` (Tarefa 2).
- `ComparatorForm` ganha a prop `inflation: { percent: string; note: string } | null` e o campo "Inflação estimada (% a.a.)".
- A tabela ganha as colunas "Líquido em reais de hoje" (`toPresentValue(net, inf, dias/365)`) e "Retorno real anualizado" (`realRate(netReturnAnnualized, inf)`). Elas só aparecem quando a inflação é válida.
- `compareFixedIncome` não muda. O destaque "maior valor líquido nesta simulação" também não.

- [ ] **Passo 1:** testes que falham: com inflação 5%, R$ 10.000 e 365 dias, a linha do CDB mostra o líquido ÷ 1,05 formatado e o retorno real anualizado; com inflação vazia, as colunas novas não existem; com inflação inválida, há erro de campo.
- [ ] **Passo 2:** implemente; a página busca `ipca12m`.
- [ ] **Passo 3:** no E2E (BCB fora), acrescente a `comparator.spec.ts`: preencher a inflação com 5 e conferir que aparece a coluna "Líquido em reais de hoje" e nenhum `NaN`.
- [ ] **Passo 4:** commit `feat(comparador): líquido em reais de hoje e retorno real`.

### Tarefa 5: página do simulador de inflação

**Arquivos:**
- Criar: `src/app/simuladores/inflacao/page.tsx`; `src/features/inflation/{InflationSimulator.tsx,CorrectionForm.tsx,PurchasingPowerForm.tsx,url-state.ts,inflation.test.tsx}`; `tests/e2e/inflation.spec.ts`
- Modificar: `src/lib/config/tools.ts` (`inflacao` → `status: 'available'`, `href: '/simuladores/inflacao'`); `src/app/sitemap.ts` (STATIC_PATHS); `tests/e2e/routes.ts` (ROUTES)

**Interfaces:**
- Consome: `marketData.getIndicatorHistory('ipcaMonth', REAL_START_MONTH)` (Tarefa 1); `correctByIpca`, `purchasingPower`, `REAL_START_MONTH` (Tarefa 2); `inflationDefault` (Tarefa 3); `Tabs` de `src/components/ui`; `DataSourceBadge`.
- Parâmetros de URL:
  - `aba` = `corrigir` | `futuro`;
  - aba Corrigir: `valor`, `de` e `ate` (MM/aaaa);
  - aba Futuro: `valor`, `anos` e `inflacao`.
- Padrões:
  - Corrigir: R$ 1.000; `de` = mês de 10 anos antes do último mês da série; `ate` = último mês.
  - Futuro: R$ 1.000, 10 anos, inflação = `inflationDefault`.
- Convenção exibida: "Considera o IPCA dos meses seguintes ao mês inicial até o mês final, inclusive."
- Série indisponível: a aba Corrigir mostra "Dado indisponível no momento" e não tem formulário de cálculo. A aba Futuro continua funcionando, com a inflação digitada.

- [ ] **Passo 1:** testes de componente que falham, com a série da fixture de 2024 injetada:
  - de 01/2024 a 04/2024 com R$ 1.000 mostra o valor corrigido com o fator da Tarefa 2 e "3 meses";
  - "13/2024" dá erro de formato;
  - fim antes do início dá "O mês final deve ser igual ou posterior ao inicial";
  - fora da série dá "Período fora da série disponível (07/1994 a MM/aaaa)";
  - série unavailable dá "Dado indisponível no momento";
  - aba Futuro com R$ 1.000, 2 anos e 5% mostra 1.102,50 e 907,03.
- [ ] **Passo 2:** implemente a página e os componentes; atualize `TOOLS`, o sitemap e `routes.ts`.
- [ ] **Passo 3:** escreva `tests/e2e/inflation.spec.ts`:
  - com o BCB fora, a aba Corrigir mostra "Dado indisponível no momento";
  - a aba Futuro com 5% calcula sem `NaN`;
  - acrescente `/simuladores/inflacao` às páginas do axe (`KEY_PAGES` ou lista própria no `a11y.spec.ts`).
- [ ] **Passo 4:** `npm test` e `npx playwright test tests/e2e/inflation.spec.ts tests/e2e/routes.spec.ts tests/e2e/a11y.spec.ts`.
- [ ] **Passo 5:** commit `feat(simuladores): simulador de inflação com IPCA real`.

### Tarefa 6: funções de aposentadoria e independência financeira

**Arquivos:**
- Criar: `src/lib/finance/retirement.ts` e `src/lib/finance/retirement.test.ts`

**Interfaces:**
- Produz:
  - `type RetirementInput = { currentAge: number; targetAge: number | null; currentWealth: number; monthlyContribution: number; desiredMonthlyIncome: number; realAnnualReturn: number /* fração 0..0.15 */ }`
  - `retirementInputSchema: z.ZodType<RetirementInput>`, com estas mensagens:
    - idade 18 a 100: "Informe uma idade entre 18 e 100 anos";
    - idade-alvo maior que a atual e até 100: "A idade-alvo deve ser maior que a idade atual e no máximo 100";
    - valores ≥ 0;
    - renda > 0;
    - retorno de 0 a 0,15: "Informe uma rentabilidade real entre 0% e 15% a.a.".
  - `type RetirementResult`:
    ```ts
    {
      requiredWealth: number | null;
      monthsToTarget: number | null;
      ageAtTarget: { years: number; months: number } | null;
      contributionForTargetAge: number | 'already-covered' | null;
      yearly: { age: number; wealth: number }[];
    }
    ```
  - `retirementPlan(input: RetirementInput): RetirementResult`
- Regras:
  - `i = (1+real)^(1/12) − 1`; `requiredWealth = renda / i`; com `real = 0` → `null` e todo o resto `null`/vazio, exceto `yearly`.
  - `monthsToTarget` é o menor `n ≤ 1200` em que o saldo (aporte no fim do mês, igual a `compoundInterest`) ≥ `requiredWealth`. `0` se o patrimônio atual já basta; `null` se não atinge.
  - `contributionForTargetAge`, com `n = (targetAge − currentAge)·12`:
    `PMT = (req − W·(1+i)^n)·i / ((1+i)^n − 1)`.
    `≤ 0` → `'already-covered'`; sem idade-alvo → `null`.
  - `yearly`: o saldo ao fim de cada ano de idade, de `currentAge` até a maior entre a idade do alvo e a idade-alvo, limitado a 100 anos.

- [ ] **Passo 1:** testes que falham:
  - renda 5.000 a 4% → `requiredWealth` = `5000/(1.04**(1/12)-1)` (≈ 1.527.305,26);
  - real 0 → `requiredWealth` null;
  - patrimônio 2.000.000 → `monthsToTarget` 0 e `'already-covered'` com idade-alvo;
  - patrimônio 0, aporte 0 → `monthsToTarget` null;
  - um caso numérico de `monthsToTarget`, conferido por um laço manual no próprio teste;
  - PMT com idade 30, alvo 60, patrimônio 0, renda 5.000, 4%: o saldo do PMT calculado após 360 meses ≈ `requiredWealth` (tolerância de R$ 0,01);
  - o schema rejeita alvo ≤ idade atual, com a mensagem acima.
- [ ] **Passo 2:** implemente; `npx vitest run src/lib/finance/retirement.test.ts` deve passar.
- [ ] **Passo 3:** commit `feat(finance): aposentadoria e independência financeira (perpetuidade real)`.

### Tarefa 7: página de aposentadoria e independência financeira

**Arquivos:**
- Criar: `src/app/simuladores/independencia-financeira/page.tsx`; `src/features/retirement/{RetirementForm.tsx,RetirementResult.tsx,url-state.ts,retirement.test.tsx}`; `tests/e2e/retirement.spec.ts`
- Modificar:
  - `src/lib/config/tools.ts`: as entradas `aposentadoria` e `independencia-financeira` viram uma só, com `id: 'independencia-financeira'`, título "Aposentadoria e independência financeira", descrição "Estime o patrimônio para viver de rendimentos e em quanto tempo chegar lá.", `href: '/simuladores/independencia-financeira'`, `status: 'available'` e as palavras-chave das duas;
  - sitemap; `tests/e2e/routes.ts`; e qualquer teste que conte entradas de `TOOLS` (use `TOOLS.length`, nunca número fixo).

**Interfaces:**
- Consome: `retirementPlan`, `retirementInputSchema` (Tarefa 6); `StackedAreaChart` ou `AreaChart` de `src/components/charts` (gráfico do patrimônio por idade, com o necessário citado no texto e na tabela); `Table`.
- URL: `idade`, `alvo`, `patrimonio`, `aporte`, `renda`, `real`.
- Padrões: 30 anos, sem alvo, R$ 10.000, R$ 1.000 por mês, R$ 5.000 de renda e 4%.

- [ ] **Passo 1:** testes de componente que falham:
  - o caso padrão mostra o "Patrimônio necessário" formatado e o tempo em "X anos e Y meses" com a idade;
  - real 0 mostra "Com rentabilidade real zero, não é possível viver só dos rendimentos";
  - meta não atingida mostra "Com esses valores, o patrimônio necessário não é atingido em 100 anos";
  - com alvo 60, aparece o "Aporte mensal necessário";
  - patrimônio suficiente mostra "O patrimônio atual já cobre a renda desejada nesta simulação";
  - o aviso "Valores em reais de hoje. Rentabilidade real constante é uma simplificação; IR e custos não estão incluídos." está presente.
- [ ] **Passo 2:** implemente; atualize `TOOLS`, o sitemap e as rotas.
- [ ] **Passo 3:** E2E: a página abre, o caso padrão aparece sem `NaN`, mudar a renda atualiza a URL e o axe passa.
- [ ] **Passo 4:** commit `feat(simuladores): aposentadoria e independência financeira`.

### Tarefa 8: funções de financiamento SAC e Price

**Arquivos:**
- Criar: `src/lib/finance/financing.ts` e `src/lib/finance/financing.test.ts`

**Interfaces:**
- Consome: `annualToMonthly` (`src/lib/finance/rates.ts`).
- Produz:
  - `type FinancingInput = { principal: number; rate: number; ratePeriod: 'month' | 'year'; months: number /* 1..420 */; extraMonthly: number }`
  - `financingInputSchema`
  - `type FinancingRow = { month: number; installment: number /* juros + amortização regular */; interest: number; amortization: number; extra: number; balance: number }`
  - `type FinancingResult = { rows: FinancingRow[]; firstInstallment: number; lastInstallment: number; totalPaid: number /* inclui extras */; totalInterest: number; months: number }`
  - `simulateFinancing(input: FinancingInput, system: 'sac' | 'price'): FinancingResult`
  - `compareSystems(input: FinancingInput): { sac: FinancingResult; price: FinancingResult; savings: { sac: { interest: number; months: number }; price: { interest: number; months: number } } | null }`. `savings` é `null` quando `extraMonthly = 0`.
- Regras:
  - **Price:** PMT fixo calculado com o prazo original (taxa 0 → `PV/n`).
  - **SAC:** amortização `PV/n` constante.
  - Em cada mês: juros = saldo·i. A amortização e o extra são limitados ao saldo, de modo que o saldo nunca fica negativo e a última parcela é ajustada.
  - O laço termina quando o saldo é ≤ 0,005.

- [ ] **Passo 1:** testes que falham, com tolerância de 0,01:
  - Price PV 100.000, 1% a.m., 12 meses → `firstInstallment` 8.884,88 e `totalInterest` 6.618,55;
  - SAC, mesmos dados → 9.333,33, `lastInstallment` 8.416,67 e `totalInterest` 6.500,00;
  - taxa 0 → juros 0 e parcela `PV/n`;
  - prazo 1 → uma linha;
  - extra 1.000 na Price → `months` < 12, `totalInterest` < 6.618,55, nenhum `balance` < 0 e `savings` positivo;
  - extra 200.000 → quita no mês 1;
  - 420 meses a 2% a.m. → valores finitos;
  - 12% a.a. → taxa mensal = `annualToMonthly(0.12)`.
- [ ] **Passo 2:** implemente; o teste deve passar.
- [ ] **Passo 3:** commit `feat(finance): financiamento SAC e Price com amortização extra`.

### Tarefa 9: página de financiamento

**Arquivos:**
- Criar: `src/app/simuladores/financiamento/page.tsx`; `src/features/financing/{FinancingForm.tsx,FinancingResult.tsx,url-state.ts,financing.test.tsx}`; `tests/e2e/financing.spec.ts`
- Modificar:
  - `src/lib/config/tools.ts`: `financiamento` e `amortizacao` viram uma só entrada, com `id: 'financiamento'`, título "Financiamento: SAC e Price", descrição "Compare parcelas e juros totais nos sistemas SAC e Price, com amortização extra.", `href: '/simuladores/financiamento'`, `status: 'available'` e as palavras-chave das duas;
  - sitemap; `tests/e2e/routes.ts`.

**Interfaces:**
- Consome: `compareSystems`, `financingInputSchema` (Tarefa 8); `AreaChart`/`BarChart` (evolução da parcela por sistema); `Table`.
- URL: `valor`, `taxa`, `periodo` (`mes`|`ano`), `prazo`, `extra`.
- Padrões: R$ 300.000, 1% a.m., 360 meses, extra 0.
- A tela mostra SAC e Price lado a lado (em coluna única no celular), com: primeira e última parcela, total pago, total de juros e número de parcelas; com extra, também a economia de juros e de meses. Abaixo vem a tabela anual e, dentro de um `<details>`, a tabela mensal. Não há destaque de "melhor".
- Textos fixos:
  - "No SAC as parcelas começam maiores e diminuem; os juros totais tendem a ser menores. Na Price as parcelas são iguais; os juros totais tendem a ser maiores."
  - "Seguros, taxas administrativas, correção pela TR, IOF e CET não estão incluídos; a parcela real do contrato será diferente."

- [ ] **Passo 1:** testes de componente que falham:
  - com PV 100.000, 1% e 12 meses, a tela mostra 8.884,88 (Price) e 9.333,33 (SAC);
  - com extra, aparece a "Economia de juros";
  - os dois textos fixos estão presentes;
  - entrada inválida dá erro de campo.
- [ ] **Passo 2:** implemente; atualize `TOOLS`, o sitemap e as rotas.
- [ ] **Passo 3:** E2E: abre, mostra as duas colunas sem `NaN`, não rola na horizontal em 375 px e o axe passa.
- [ ] **Passo 4:** commit `feat(simuladores): financiamento SAC e Price`.

### Tarefa 10: documentação e verificação final

**Arquivos:**
- Modificar: `README.md` (seção de funcionalidades), `docs/ROADMAP.md` (Fase 2A concluída; renda passiva e dividendos seguem planejados), `docs/ARCHITECTURE.md` (ADR "Convenção do IPCA: razão entre números-índice de fim de mês, desde 07/1994" e ADR "Independência financeira como perpetuidade real"), `docs/API.md` (nova operação `getIndicatorHistory` e o uso da série 433).

- [ ] **Passo 1:** atualize a documentação.
- [ ] **Passo 2:** rode `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e && npm run format:check` e cole as saídas no relatório.
- [ ] **Passo 3:** commit `docs: Fase 2A (simuladores)`.
