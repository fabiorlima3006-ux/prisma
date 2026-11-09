# Arquitetura

Este documento descreve as camadas do Prisma, o fluxo de dados (`DataResult` e `DataMeta`), as definições canônicas de indicadores e as decisões de arquitetura (ADRs). A fonte da verdade do escopo é `docs/superpowers/specs/2026-11-07-plataforma-investimentos-design.md`.

## 1. Camadas

```
Navegador (Client Components só onde há interação)
        |
Next.js App Router: Server Components (renderização + SEO)
        |                     |
        |              Route Handlers /api/market/*  (valida, limita, cacheia)
        |                     |
        +--------> lib/finance  (funções puras, sem I/O, "hoje" por parâmetro)
                              |
                   lib/data: MarketDataService
                              |
             +----------------+-----------------+
        BcbProvider      BrapiProvider      DemoProvider
             |                 |                  |
         API BCB (SGS)    API brapi.dev     gerador determinístico
```

| Camada | Pasta | Regra |
|---|---|---|
| Interface | `src/app`, `src/components`, `src/features` | Server Components por padrão; `'use client'` só onde há interação. Nunca chama API externa. |
| Domínio | `src/lib/finance` | Funções puras, sem I/O, sempre testadas (TDD). |
| Dados | `src/lib/data` | A única camada que conhece fornecedores (`bcb`, `brapi`, `demo`). Módulos que leem segredos importam `server-only`. |
| Configuração | `src/lib/config` | `env.ts` (Zod), `site.ts`, `tax-rules.ts` (com vigência e fonte), `features.ts` (planos). |
| Transversal | `src/lib/format`, `security`, `seo`, `search` | Formatação pt-BR (Intl), cabeçalhos e rate limit, metadados, índice de busca. |
| Conteúdo | `content/` | Artigos educativos em MDX, versionados no repositório. |

Validação com Zod em três fronteiras: formulários, parâmetros de rota/API e respostas externas. `src/proxy.ts` (Next 16) redireciona maiúsculas em rotas de ativo antes da renderização.

## 2. Fluxo de dados: `DataResult` e `DataMeta`

Toda leitura de mercado devolve um `DataResult<T>`:

```ts
type DataMeta = { source: 'bcb' | 'brapi' | 'demo'; isDemo: boolean; asOf: string; attribution: string };

type DataResult<T> =
  | { status: 'ok'; data: T; meta: DataMeta }
  | { status: 'unavailable'; reason: 'fetch-failed' | 'invalid-response' | 'not-provided' | 'empty';
      source: DataSource; attribution: string };
```

```
UI / rota  -->  MarketDataService  -->  provedor escolhido pelo ativo e pelo ambiente
                                              |
              resposta externa --> Zod --> ok?  sim: { status: 'ok', data, meta }
                                               nao: { status: 'unavailable', reason }
UI: ok + isDemo=false -> valor + DataSourceBadge (fonte, data)
    ok + isDemo=true  -> valor + selo "DADOS DEMONSTRATIVOS"
    unavailable       -> "Dado indisponível no momento"  (nunca troca por demo)
    campo ausente     -> "Dado não disponível"           (value = null)
```

Pontos centrais:

- O provedor é escolhido **por ativo**: sem `BRAPI_TOKEN`, ações e índices da B3 vão para o demo; com o token, vão para a brapi. Indicadores macro vêm sempre do BCB.
- Falha de rede, timeout (5000 ms) ou resposta fora do schema viram `unavailable` e são registradas em log. O build e o ISR nunca quebram.
- Cache: 3600 s para o BCB e 900 s para a brapi. Selic usa consulta por período (ver ADR 11).
- `DataMeta` alimenta o `DataSourceBadge`. Grupos mistos mostram os dois selos (ADR 12).

## 3. Definições canônicas de indicadores

Valem para todas as empresas e vêm da skill `financial-analysis`:

- Fluxos em **12 meses (TTM)**; balanço = último disponível.
- **Valor de mercado** = soma de todas as classes (ON + PN + units) sem tesouraria. DY e preço são por ticker.
- **Proventos** = dividendos + JCP **brutos** por **data-com** nos 12 meses.
- **ROE** = lucro TTM / PL médio (início + fim)/2; sem PL anterior, PL final (registrar).
- **ROIC** = EBIT·(1 − alíquota efetiva, limitada a [0,1], fallback 34%) / (PL + minoritários + dívida bruta − caixa).
- **Dívida líquida** = dívida bruta − caixa e aplicações; decidir uma vez se inclui arrendamento IFRS 16.
- **Caixa líquido** → exibir "Caixa líquido" (valor negativo mantido para ordenação).
- **CAGR 5a** só com lucro positivo no início e no fim.
- **RSI** com suavização de Wilder, preços ajustados por proventos e desdobramentos.

Estados de exibição: fonte não forneceu = "Dado não disponível" (`null`); sem significado (P/L com prejuízo, P/VP com PL negativo, ROIC/Dív. Líq./EBITDA em banco) = "Não se aplica" com o motivo no tooltip; calculado = valor pt-BR + fonte + data. `null` nunca entra em ordenação nem filtro como número. No MVP, o modo demonstrativo **não** simula indicadores.

## 4. Decisões de arquitetura (ADRs)

### ADR 1. Next.js em vez de Astro
- **Contexto:** o produto cresce para login, carteira, alertas e IA, além de conteúdo e SEO.
- **Decisão:** Next.js (App Router) + React + TypeScript. Route Handlers escondem chaves e fazem o papel de backend.
- **Consequências:** SSR/SSG para SEO e velocidade e um único projeto até a Fase 4. O Astro seria ótimo só para conteúdo, mas fraco para a interatividade das Fases 2 a 4. Custo: mais JavaScript no cliente do que um site estático puro.

### ADR 2. Sem banco no MVP
- **Contexto:** o MVP não tem usuários nem dados pessoais; catálogo e artigos são estáticos.
- **Decisão:** nenhum banco. O esquema da Fase 2 (PostgreSQL + Drizzle) fica planejado em `docs/DATABASE.md`.
- **Consequências:** deploy trivial, zero risco de LGPD e custo zero. Sem persistência de preferências além de `localStorage` (tema).

### ADR 3. Sem fallback silencioso para demonstrativo
- **Contexto:** trocar uma fonte real que falhou por dado simulado faria o usuário ler número inventado como real.
- **Decisão:** fonte real que falha vira `unavailable` e a tela mostra "Dado indisponível no momento".
- **Consequências:** integridade dos dados acima de aparência. A tela pode ficar com lacunas quando a API cai. O demonstrativo só existe quando o ativo é demonstrativo desde o início, sempre com o selo.

### ADR 4. CSP sem nonce
- **Contexto:** nonce por requisição obriga renderização dinâmica e derruba o cache estático.
- **Decisão:** CSP estática em `next.config.ts`, com `script-src 'self' 'unsafe-inline'` em produção (sem `'unsafe-eval'`) e `style-src 'self' 'unsafe-inline'`.
- **Consequências:** páginas permanecem estáticas/ISR. A proteção contra XSS por script inline é menor do que com nonce; mitigada por não haver conteúdo de usuário renderizado. Como não há `'unsafe-eval'`, o Zod roda sem JIT (`src/lib/zod-setup.ts`).

### ADR 5. Convenção diária para % do CDI
- **Contexto:** CDB e LCI/LCA remuneram um percentual do CDI; o mercado capitaliza a taxa diária.
- **Decisão:** fator = `(1 + p·((1+CDI)^(1/252) − 1))^du`, com `du = round(dc × 252/365)`.
- **Consequências:** coerente com a prática de mercado e diferente de multiplicar a taxa anual por `p`. A aproximação de dias úteis é exibida como premissa. Não considera feriados.

### ADR 6. Rate limit em memória
- **Contexto:** as rotas `/api/market/*` precisam de proteção básica contra abuso, e o MVP não tem Redis.
- **Decisão:** limitador de janela fixa em memória, 60 req/min por IP, com teto de 10.000 chaves.
- **Consequências:** vale por instância; em serverless o limite efetivo é maior e zera a cada cold start. É melhor esforço, não garantia. Plano: Upstash Redis na Fase 2.

### ADR 7. Ativo brapi nunca mistura demonstrativo
- **Contexto:** um ativo com cotação real e seções simuladas na mesma página confunde a origem de cada número.
- **Decisão:** ativo atendido pela brapi não ganha seções demonstrativas; o que a brapi não fornece fica "Dado não disponível".
- **Consequências:** páginas de ativos reais ficam mais enxutas (fundamentos só com P/L). Em contrapartida, nenhum número é inventado.

### ADR 8. Índice de busca estático
- **Contexto:** a busca global deve funcionar sem banco nem serviço externo.
- **Decisão:** índice gerado do catálogo, das ferramentas e dos artigos, servido por `src/app/search-index.json/route.ts` e carregado sob demanda no navegador; correspondência normalizada (sem acento e sem caixa).
- **Consequências:** zero infraestrutura e busca instantânea. O índice é memoizado por processo (em dev, reinicie para atualizar) e a relevância é simples.

### ADR 9. Canvas no hero em vez de SVG (ruling R10)
- **Contexto:** o hero usa uma esfera de ~620 pontos que explode e forma um gráfico em alta, inspirada na referência pedida por Fabio.
- **Decisão:** canvas 2D puro, sem WebGL nem biblioteca. Exceção registrada à regra "SVG/CSS" por desempenho; as demais ilustrações continuam em SVG.
- **Consequências:** animação leve e sem dependência. Com `prefers-reduced-motion` **ou em telas menores que 768 px** (decisão do Fabio em 2026-11-08, para a Performance mobile), o gráfico já aparece formado e estático. No computador, a animação roda uma vez e para.

### ADR 10. Catálogo com 17 itens (ruling R11)
- **Contexto:** o spec dizia "16 itens", mas a lista da seção 9.3 soma 17.
- **Decisão:** vale a lista explícita: 17 itens. Telas e testes usam `CATALOG.length`, nunca um número fixo.
- **Consequências:** nenhum retrabalho se o catálogo crescer.

### ADR 11. Selic com consulta por período (ruling R12)
- **Contexto:** `ultimos/1` na série 432 pode devolver uma vigência futura (a API retornou 09/12/2026), o que mostraria uma data enganosa.
- **Decisão:** todas as séries consultam por período (`dataInicial = hoje − janela`, `dataFinal = hoje`; janela de 30 dias nas diárias e 180 no IPCA) e pegam a última linha com data menor ou igual a hoje. Até 2026-11-08 só a Selic fazia isso; as demais usavam `ultimos/1`, que passou a responder `304` sem corpo no CDI (R34).
- **Consequências:** uma URL diferente para uma série; a taxa exibida é a vigente hoje.

### ADR 12. Grupos mistos mostram os dois selos (ruling R18)
- **Contexto:** um grupo com dados reais e demonstrativos poderia esconder a fonte real sob o selo demo.
- **Decisão:** o grupo misto exibe "DADOS DEMONSTRATIVOS" (se houver demo) **e** o selo da fonte real (atribuição e data dos itens reais). Grupos puros não mudam.
- **Consequências:** nunca há mistura sem identificação. A faixa de indicadores da Home fica um pouco mais carregada.

### ADR 13. Proxy para o redirecionamento de maiúsculas (ruling R20)
- **Contexto:** redirecionar `/acoes/PETR4` durante a renderização ISR podia gravar um 200 em cache.
- **Decisão:** `src/proxy.ts` (Next 16), com matcher nos prefixos de ativo, responde 308 para a URL em minúsculas antes de renderizar. A checagem na página fica como reserva.
- **Consequências:** URL canônica única e sem cache incorreto. O prefixo em maiúsculas (`/ACOES/...`) não casa no matcher e cai em 404.

### ADR 14. `/busca` com noindex (ruling R22)
- **Contexto:** páginas de resultado de busca interna são conteúdo raso e duplicado; o Google recomenda não indexá-las. O spec (9.8) as previa indexáveis.
- **Decisão:** `/busca` é `noindex`, com e sem termo, e fica fora do sitemap.
- **Consequências:** nenhuma perda real de SEO; divergência consciente do spec.

### ADR 15. Texto de privacidade sobre valores na URL (ruling R19)
- **Contexto:** o simulador lê `searchParams` no servidor, então não é verdade que as entradas "ficam só no navegador".
- **Decisão:** a Privacidade afirma que os valores podem aparecer na URL para compartilhamento, são usados apenas para calcular a página e não são armazenados.
- **Consequências:** texto verdadeiro e auditável. Quem compartilha o link compartilha os valores.

### ADR 16. Planos em `features.ts` sem cobrança
- **Contexto:** a Fase 4 terá planos Gratuito, Premium e Profissional.
- **Decisão:** `src/lib/config/features.ts` registra cada funcionalidade com `minPlan`; `canAccess` devolve sempre `true` no MVP.
- **Consequências:** a futura regra de acesso entra em um ponto só, sem espalhar `if` pela interface. Nada é bloqueado hoje.


### ADR 17. Convenção do IPCA: razão entre números-índice de fim de mês, desde 07/1994
- **Contexto:** a inflação em reais de hoje precisa de uma regra única para corrigir um valor entre duas datas usando a série 433 (IPCA mensal) do Banco Central.
- **Decisão:** o fator de correção é o produto de `(1 + IPCA)` dos meses **posteriores** ao mês inicial, até o mês final **inclusive** (equivale à razão entre os números-índice de fim de mês). A série começa em 07/1994 (Plano Real). Está em `src/lib/finance/inflation.ts` (`correctByIpca`), função pura, com o "hoje" passado como parâmetro. Não afirmamos que o resultado seja igual ao da "Calculadora do Cidadão" do BCB, que pode usar outra convenção de mês de partida.
- **Consequências:** regra explícita e testada. Pequenas diferenças em relação a outras calculadoras são possíveis, e a tela deixa claro que é uma simulação.

### ADR 18. Independência financeira como perpetuidade real
- **Contexto:** o simulador precisa mostrar quanto patrimônio seria necessário para viver de renda, sem prometer rentabilidade.
- **Decisão:** modelo de perpetuidade real: patrimônio necessário = renda desejada / taxa real mensal, vivendo só do rendimento real, sem consumir o principal. Todos os valores ficam em reais de hoje. A taxa real padrão (4% a.a.) é uma premissa ilustrativa, rotulada como tal: não é dado de mercado nem previsão. Imposto de renda e custos não são modelados, e a tela avisa. Código em `src/lib/finance/retirement.ts` (meses até a meta e aporte mensal para uma idade-alvo).
- **Consequências:** conta simples e fácil de explicar. O resultado tende a ser otimista por ignorar IR e custos. Nenhum dado de mercado é simulado.

### ADR 19. Estado dos simuladores na URL via `history.replaceState`
- **Contexto:** com `router.replace`, cada tecla gerava uma ida ao servidor para renderizar a página de novo, o que travava quando o Banco Central demorava a responder (timeout).
- **Decisão:** os simuladores atualizam a URL com `window.history.replaceState`, com debounce e **nunca na montagem**. O cálculo roda no cliente, sem nova renderização no servidor.
- **Consequências:** digitação fluida e link compartilhável. Voltar/avançar do navegador continua sem ressincronizar o formulário (pendência já registrada).

### ADR 20. Histórico do IPCA em streaming (promessa + `use()` dentro de `Suspense`)
- **Contexto:** `/simuladores/inflacao` depende de uma série longa do BCB (blocos de até 10 anos, timeout de 10 s). Esperar por ela atrasaria a página inteira.
- **Decisão:** a página inicia a busca sem `await`, passa a promessa a um componente de cliente que a lê com `use()` dentro de `Suspense`. O resto da página renderiza de imediato, e a área do histórico mostra um estado de carregamento. Se o BCB falhar, aparece "indisponível", nunca dado demonstrativo (ADR 3).
- **Consequências:** a página abre mesmo com o BCB lento. A correção pelo IPCA só fica disponível quando o histórico chega.

### ADR 21. Cache das instâncias de `Intl.NumberFormat`
- **Contexto:** criar um `Intl.NumberFormat` a cada chamada é caro e pesava em tabelas grandes (o financiamento gera centenas de linhas).
- **Decisão:** `src/lib/format` guarda as instâncias em cache, uma por conjunto de opções, e as reutiliza.
- **Consequências:** tabelas mais leves de renderizar; a API de formatação não mudou.
