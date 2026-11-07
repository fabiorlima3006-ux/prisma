# Plataforma de Análise Financeira e Investimentos — Documento de Design

- **Data:** 2026-11-07
- **Autor do pedido:** Fabio (dono do projeto)
- **Status:** aguardando aprovação final do documento. Fabio concordou com as decisões da seção 14 em 2026-11-07.
- **Nome do produto:** "Prisma" é **provisório**. Trate-o como uma constante única de configuração (`siteConfig.name`) para poder trocá-lo em um só lugar.

Este documento cobre as Etapas 1 (Análise), 2 (Arquitetura) e 3 (Roadmap) do prompt original. Também especifica o MVP em detalhe suficiente para planejar a implementação (Etapas 4 a 6).

---

## 1. Intenção e o porquê

Fabio quer uma **central para entender, analisar e acompanhar investimentos**, com foco em **educação, análise e decisão consciente**, nunca em recomendação.

O projeto é **pessoal, de estudo e de portfólio**. Isso tem três consequências:

- **Quem avalia o código** (recrutadores, outros devs) pesa arquitetura limpa, testes, documentação e acessibilidade mais do que a quantidade de telas.
- **O custo tem que ser zero:** só serviços e APIs gratuitos.
- **Não há usuários reais nem cobrança agora.** Mesmo assim, a arquitetura precisa crescer até uma plataforma completa (MVP → Fase 2 → Fase 3 → Fase 4) sem ser reescrita.

Fabio delegou as decisões técnicas e acompanha pelo resultado. Ele aprovou a direção visual (seção 6) e a stack (seção 8).

## 2. Objetivos, não-objetivos e anti-objetivos

### Objetivos
- Uma Home e páginas de mercado bonitas e intuitivas, com animações em SVG.
- Dados **reais onde forem gratuitos**: Banco Central para Selic, CDI, IPCA e PTAX. O resto entra como demonstrativo ou por um provedor opcional.
- Simuladores com **cálculos matematicamente corretos e testados**.
- Uma camada de dados que permita trocar de fornecedor sem mexer na interface.
- Conteúdo educativo indexável (SEO).
- Responsividade com prioridade para o celular, modo claro e escuro, e acessibilidade nível WCAG 2.2 AA.
- Documentação: `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `API.md` e `DATABASE.md`.

### Não-objetivos (agora)
- Login, banco de dados, carteira persistida, opções, screener, notícias reais, Assistente com IA e cobrança. Tudo isso está no roadmap (seção 12). A arquitetura deve **prever** esses recursos, sem implementá-los.
- Cotações em tempo real ou intradiárias.
- Cobrir todos os ativos do mercado. O MVP usa um catálogo pequeno e curado (seção 9.3).

### Anti-objetivos (seria um fracasso mesmo funcionando)
- **Qualquer dado fictício exibido sem o selo "DADOS DEMONSTRATIVOS"**, ou dado demonstrativo misturado a dado real sem identificação.
- **Indicadores inventados.** Na falta de um dado, aparece "Dado não disponível". Isso vale **também no modo demonstrativo**: só preço e histórico podem ser simulados; indicadores fundamentalistas nunca são.
- Aparência de cassino, de aposta ou de promoção: contagem regressiva, "restam N", preço riscado, sorteio, depoimentos de ganho, "fique rico".
- Linguagem que prometa lucro, retorno garantido ou ganho fácil, ou que diga "compre" ou "venda".
- Chaves de API, tokens ou segredos no código ou no bundle do navegador.
- Um protótipo descartável: código sem testes, sem tipos ou sem camadas.

## 3. Restrições

- **Ambiente do Fabio:** Windows 11, Node 26 e npm 11. Use **npm** como gerenciador de pacotes.
- **Custo zero:** hospedagem na Vercel (plano Hobby) e só APIs gratuitas. A brapi.dev é opcional e exige um cadastro gratuito para obter o token.
- **Idioma:** interface, conteúdo e documentação em **português do Brasil**. Código (identificadores) em inglês. Comentários em português ou inglês, desde que consistentes por arquivo.
- **Avisos obrigatórios:** o aviso padrão (seção 10.4) aparece no rodapé de todas as páginas e, em destaque, em todo simulador e página de ativo.
- **Repositório:** git inicializado em `C:\Users\fabio\Projetos\01`, branch `main`.

---

## 4. Etapa 1 — Análise

### 4.1 Funcionalidades (mapa completo, por fase)

| Área | Funcionalidades | Fase |
|---|---|---|
| Home | Resumo do mercado, faixa de indicadores, destaques, ferramentas, trilhas, CTA | MVP |
| Mercados | Brasil, Exterior e Cripto; tabelas e cards por categoria | MVP (com dados mistos) |
| Página de ativo | Preço, variações, faixa de máxima e mínima, gráfico, indicadores, riscos, aviso | MVP |
| Listas por classe | `/acoes`, `/fiis`, `/etfs`, `/cripto` listando o catálogo | MVP |
| Simulador de juros compostos | Entradas, resultados, gráfico, tabela mês a mês | MVP |
| Comparador de renda fixa | Poupança × CDB × Tesouro Selic × LCI/LCA | MVP |
| Educação | Trilhas Iniciante, Intermediário e Avançado; artigos em MDX | MVP |
| Busca global | Ativos, artigos, ferramentas e páginas; atalho Ctrl/⌘+K | MVP |
| Páginas legais | Sobre, Contato, Termos, Privacidade | MVP |
| Login e perfil | Conta, preferências, nível do usuário | Fase 2 |
| Watchlist, favoritos, histórico | | Fase 2 |
| Carteira manual | Ativos, quantidade, preço médio, distribuição | Fase 2 |
| Perfil de investidor | Questionário orientativo | Fase 2 |
| Mais simuladores | Aposentadoria, independência financeira, renda passiva, inflação, financiamento e amortização (SAC e Price), dividendos | Fase 2 |
| Fundos, FIIs e ETFs com dados reais | Dados abertos da CVM | Fase 2 |
| Análise técnica | Candles, médias, RSI, MACD, Bollinger | Fase 2 |
| Notícias | Títulos e resumos de feeds RSS com link para a fonte | Fase 2 |
| Opções | Educação, Black-Scholes, gregas, simulador de payoff de 9 estratégias | Fase 3 |
| Screener e rankings | Filtros fundamentalistas com critérios explícitos | Fase 3 |
| Alertas e notificações | | Fase 3 |
| Assistente de Investimentos (IA) | Educativo, com cálculos e fontes | Fase 3 |
| Planos (Gratuito, Premium, Profissional) | Cobrança, API pública, relatórios | Fase 4 |

### 4.2 Páginas (rotas)
O MVP implementa de verdade: `/`, `/mercados`, `/acoes`, `/acoes/[ticker]`, `/fiis`, `/fiis/[ticker]`, `/etfs`, `/etfs/[ticker]`, `/cripto`, `/cripto/[ticker]`, `/simuladores`, `/simuladores/juros-compostos`, `/ferramentas`, `/ferramentas/comparador`, `/educacao`, `/educacao/[trilha]`, `/educacao/[trilha]/[artigo]`, `/busca`, `/sobre`, `/contato`, `/termos` e `/privacidade`.

As rotas abaixo existem como **página "em construção"**, com a fase prevista e links para o que já funciona: `/renda-fixa`, `/fundos`, `/opcoes`, `/carteira`, `/analises`, `/noticias`, `/assistente`, `/perfil` e `/entrar`.

- **`/renda-fixa`:** no MVP é um hub com conteúdo educativo e um link para o comparador. Não tem dados de títulos.
- **`/contato`:** no MVP é estático e mostra **apenas o GitHub do Fabio**, por decisão dele. Sem e-mail, sem formulário e sem backend. O endereço do perfil fica em `siteConfig.links.github`.

### 4.3 Entidades de domínio
A forma persistida está em `DATABASE.md`; a seção 9.2 traz os tipos.
- `Asset`: ticker, nome, classe (`stock | fii | etf | crypto | index | currency | rate`), mercado (`BR | US | CRYPTO`), moeda.
- `Quote`: preço, variações por período, volume, máxima e mínima, data e hora. Sempre com `DataMeta`.
- `PricePoint` / `PriceSeries`: histórico diário.
- `EconomicIndicator`: Selic, CDI, IPCA e PTAX, com data de referência.
- `Fundamentals`: P/L, P/VP, ROE etc. Cada campo é anulável, e `null` aparece como "Dado não disponível".
- `Article` / `Track`: conteúdo educativo.
- `Tool`: registro de simuladores e ferramentas, usado na busca e nos hubs.
- **Fase 2:** `User`, `UserPreferences`, `Watchlist`, `Portfolio`, `Position`, `Transaction`, `InvestorProfile`.
- **Fase 3:** `Alert`, `AssistantConversation`.

### 4.4 Integrações e APIs

| Fonte | Uso | Custo e chave | Fase |
|---|---|---|---|
| **Banco Central (SGS)**, `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{n}?formato=json` | Selic meta, CDI, IPCA (mensal e 12 meses), PTAX, TR | Gratuita, sem chave | MVP |
| **brapi.dev** | Cotações e histórico de ações, FIIs, ETFs e Ibovespa (B3) | Plano gratuito com token (`BRAPI_TOKEN`) | MVP (opcional) |
| CoinGecko (API pública ou demo) | Cripto: preço, market cap, volume, dominância | Gratuita, chave demo opcional | Fase 2 |
| Dados abertos da CVM (`dados.cvm.gov.br`) | Fundos: patrimônio, cotas, informe diário | Gratuita | Fase 2 |
| Tesouro Transparente | Taxas e preços de títulos do Tesouro Direto | Gratuita | Fase 2 |
| Feeds RSS de veículos | Títulos e resumos de notícias, com link | Gratuita (respeitando os termos) | Fase 2 |
| Claude API (Anthropic) | Assistente de Investimentos | Paga (decidir na Fase 3) | Fase 3 |

**Regra:** nenhuma API é inventada. Antes de implementar, cada código de série do SGS e cada endpoint da brapi deve ser **conferido contra a fonte real**. Faça isso com um script de verificação ou com um teste marcado como `@live`, que fica fora da suíte padrão. Códigos SGS de referência, a conferir: 432 (Selic meta), 12 (CDI diário), 4389 (CDI anualizado base 252), 433 (IPCA mensal), 13522 (IPCA 12 meses), 1 (dólar PTAX venda), 226 (TR).

### 4.5 Banco de dados
- **MVP:** não tem banco. Não há dados de usuário. O catálogo de ativos e o conteúdo educativo são arquivos versionados no repositório.
- **Fase 2:** PostgreSQL (Neon, plano gratuito) com o ORM Drizzle e Auth.js. O esquema planejado fica documentado em `DATABASE.md` já no MVP.

### 4.6 Riscos técnicos
1. **Limites e instabilidade das APIs gratuitas.** Mitigação: cache no servidor (revalidação de 1 h para o BCB, 15 min para a brapi) e **fallback com aviso**. Se a fonte real falhar, a UI mostra "Dado indisponível no momento" e **nunca** troca silenciosamente por dado demonstrativo.
2. **Mudanças nas séries ou endpoints.** Mitigação: validar toda resposta com Zod. Uma falha de validação é tratada como indisponibilidade e registrada em log.
3. **Rate limiting em serverless.** Um limitador em memória vale por instância. Fica documentado como limitação, com plano de trocar por Upstash Redis na Fase 2.
4. **Precisão numérica.** Cálculos em `number` (double) com arredondamento só na exibição. Aceitável para simulação educativa; fica documentado.
5. **Peso das animações e dos gráficos.** Mitigação: SVG/CSS em vez de bibliotecas de animação, gráficos carregados sob demanda, `prefers-reduced-motion` respeitado.
6. **Tamanho do bundle.** Server Components por padrão; JS no cliente só onde há interação.

### 4.7 Riscos regulatórios e legais
- **CVM, Resolução 20/2021 (analista de valores mobiliários).** Publicar análises e recomendações exige credenciamento. Mitigação: todo conteúdo é **educativo e informativo**, sem "compre" ou "venda", sem preço-alvo e sem rankings de "melhores ações".
- **CVM, Resolução 30/2021 (suitability).** O perfil de investidor (Fase 2) é **orientativo** e diz claramente que não substitui a avaliação de um profissional.
- **LGPD.** A partir da Fase 2, haverá dados pessoais: minimização, base legal, política de privacidade e exclusão de conta. No MVP, a página de privacidade declara que não há coleta, além de cookies estritamente necessários e a preferência de tema em `localStorage`.
- **Termos de uso das fontes de dados.** A redistribuição de cotações da B3 via terceiros segue os termos da brapi. Toda fonte é atribuída na tela.
- **Direitos autorais das notícias (Fase 2).** Apenas título, resumo curto e link para o original.
- **Mudanças tributárias.** As regras de IR, IOF e isenção de LCI/LCA mudam. Elas ficam em `tax-rules.ts` com data de vigência e fonte (seção 9.6), e a UI mostra "regras vigentes em <data>".

### 4.8 Dependências principais

Escolher a versão estável atual de cada uma no momento da implementação:
- next, react, react-dom, typescript
- tailwindcss (v4) e next-themes
- zod
- recharts, carregada sob demanda
- @next/mdx (ou equivalente) para o conteúdo
- server-only

**Desenvolvimento:**
- vitest e @testing-library/react
- @playwright/test e @axe-core/playwright
- eslint e prettier

Nenhuma dependência de animação: as animações são SVG e CSS.

---

## 5. Público e adaptação por nível

São três níveis: Iniciante, Intermediário e Avançado.

**No MVP, a adaptação é por conteúdo, não por conta:**
- As trilhas de educação são separadas por nível.
- Cada artigo tem uma etiqueta de nível.
- Termos técnicos nas páginas de ativo (P/L, ROE…) têm uma **dica explicativa** (tooltip acessível) com link para o artigo correspondente.

A preferência de nível salva por usuário fica para a Fase 2.

---

## 6. Direção visual (aprovada)

**Referência obrigatória:** `docs/design/mockup-home-v3.html`. É um fragmento HTML com CSS próprio e pode ser aberto no navegador. Ele mistura três inspirações:
- **Alura:** azul-marinho com azul vivo, títulos grandes e em negrito, cards de trilha com nível, quantidade de aulas e progresso, ritmo de seções bem separadas.
- **ibe.IA:** fundo quadriculado sutil com brilhos difusos, vidro fosco (`backdrop-filter`), botão principal com brilho que passa, rótulos de seção `// rótulo` em fonte monoespaçada com sublinhado colorido, faixa de números e demonstração de chat.
- **Opções do brainstorming:** estrutura "topo escuro + conteúdo claro", gráfico de linha que se desenha, classes de ativos orbitando, barras de juros compostos crescendo.

### 6.1 Estrutura da Home (de cima para baixo)
1. **Link "Pular para o conteúdo"**, visível ao receber foco.
2. **Topo escuro, igual nos dois temas.** Fundo `#061a36` com grade de 28px e brilhos radiais em ciano e violeta. Por cima, o **header em vidro fosco**: logo, menu, busca, alternador de tema e botão "Entrar".
3. **Hero.**
   - Rótulo `// central de investimentos`.
   - H1: "Entenda o mercado. Analise seus investimentos. Tome decisões mais conscientes."
   - Subtítulo: "Uma plataforma completa para acompanhar mercados, estudar investimentos, analisar ativos e simular cenários."
   - CTA principal "Explorar mercados", com brilho que passa.
   - CTA secundário "Conhecer ferramentas", com contorno.
   - **Ilustração SVG animada:** linha de gráfico que se desenha, área com degradê que aparece e chips "Ações / FIIs / Renda fixa / Cripto" orbitando.
4. **Faixa de indicadores em vidro fosco**, sobreposta à borda do topo.
   - Grupo com selo verde **"BCB · OFICIAL"**: Selic, CDI, IPCA 12m, Dólar PTAX.
   - Grupo com selo amarelo **"DADOS DEMONSTRATIVOS"**: Ibovespa, S&P 500, Bitcoin. Esses passam a selo de fonte real automaticamente quando houver provedor real.
5. **Faixa de números da plataforma:** classes de ativos, simuladores, trilhas. **Nunca** números de ganho ou de usuários. Os números saem dos registros (por exemplo `tools.length`) e não são digitados à mão.
6. **Destaques:** cards de ativos do catálogo (`AssetCard`) e, ocupando o lugar das notícias, um bloco "Notícias, em breve".
7. **Ferramentas:** card do simulador de juros compostos com barras animadas e card do comparador.
8. **Trilhas de educação:** três cards no estilo Alura com o link "Conhecer →". O progresso é decorativo no MVP; sem login, a barra fica oculta.
9. **Vitrine do Assistente:** demonstração estática de chat com o selo "Em breve" e o aviso educativo.
10. **CTA final** convidando a explorar.
11. **Rodapé:** colunas de links, aviso padrão e atribuição das fontes de dados.

### 6.2 Tokens de design
Tudo como variáveis CSS em `:root` e `.dark`, expostas ao Tailwind. Valores de partida (do mockup):

| Token | Claro | Escuro |
|---|---|---|
| `--bg` | `#f6f8fc` | `#050f20` |
| `--surface` | `#ffffff` | `#0b2140` |
| `--surface-2` | `#eef2f7` | `#0f2a50` |
| `--text` | `#0d1b2f` | `#e9f1ff` |
| `--muted` | `#5b6b82` | `#9fb3d1` |
| `--line` | `#e2e8f0` | `rgba(255,255,255,.09)` |
| `--accent` | `#1463ff` | `#2fd3ff` |
| `--up` | `#0a8f6a` | `#19c37d` |
| `--down` | `#d63c4b` | `#ff5d6c` |
| `--hero-bg` (fixo) | `#061a36` | `#061a36` |

- **Ajuste de contraste:** qualquer par texto/fundo que não atinja o nível AA (4,5:1, ou 3:1 para texto grande e UI) deve ser ajustado. Os tokens são ponto de partida, não contrato.
- **Alta e baixa:** nunca só pela cor. Sempre com ▲/▼ e sinal de +/−.
- **Tipografia:** Inter (texto) e JetBrains Mono (rótulos `//` e números tabulares), via `next/font`, auto-hospedadas.
- **Tema:** segue o sistema por padrão, tem um alternador manual e é persistido sem "piscar" (next-themes).

### 6.3 Movimento
- Todas as animações são **SVG e CSS**: `stroke-dashoffset`, `transform`, `opacity`.
- Com `prefers-reduced-motion: reduce`, tudo fica estático no estado final.
- Animações em loop ficam **só no hero**. Nas demais seções, a animação toca **uma vez**, ao entrar na tela (IntersectionObserver).
- Qualquer faixa com rolagem automática, se existir, tem botão de pausa (padrão Alura).

### 6.4 Navegação
- **Desktop:**
  - menu principal com Mercados, Investimentos, Opções, Simuladores, Ferramentas, Educação e Notícias;
  - "Investimentos" abre um dropdown com Ações, FIIs, ETFs, Fundos, Renda fixa e Cripto;
  - Carteira, Análises, Assistente e Meu Perfil ficam no menu do usuário ou em "Mais".
- **Celular:** botão de menu que abre uma gaveta com todos os itens, e a busca acessível no header.
- **Breadcrumbs** em todas as páginas internas.
- **Barra lateral:** reservada para o painel da Carteira (Fase 2). Não é usada no MVP.

---

## 7. Etapa 2 — Arquitetura

### 7.1 Visão em camadas

```
Navegador (React Client Components só onde há interação)
        │
Next.js App Router ─ Server Components (renderização + SEO)
        │                     │
        │              Route Handlers /api/*  (BFF: valida, limita, cacheia)
        │                     │
        └────────► Serviços de domínio (lib/finance: funções puras, sem I/O)
                              │
                   Camada de dados (lib/data): MarketDataService
                              │
             ┌────────────────┼─────────────────┐
        BcbProvider     BrapiProvider      DemoProvider     (Fase 2+: CoinGecko, CVM, Tesouro)
             │                │                 │
         API BCB        API brapi.dev     fixtures + gerador determinístico
```

- **Frontend:** `src/app` e `src/components`. Não chama APIs externas diretamente.
- **Backend:** os Server Components e os Route Handlers chamam os **serviços**. Os módulos que leem segredos importam `server-only`.
- **Serviços de dados:** `lib/data`, a única camada que conhece fornecedores.
- **Autenticação (Fase 2):** Auth.js em `lib/auth`. O MVP tem só a rota placeholder `/entrar`.
- **Banco (Fase 2):** `lib/db` com Drizzle.

### 7.2 Estrutura de pastas

```
/
├─ README.md
├─ docs/
│  ├─ ARCHITECTURE.md  ROADMAP.md  API.md  DATABASE.md
│  ├─ design/mockup-home-v3.html
│  └─ superpowers/specs/…  (este documento)
├─ content/educacao/<trilha>/<artigo>.mdx
├─ public/ (og-default.png, ícones)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx  page.tsx  not-found.tsx  error.tsx
│  │  ├─ sitemap.ts  robots.ts  opengraph-image (padrão)
│  │  ├─ mercados/  acoes/  acoes/[ticker]/  fiis/  fiis/[ticker]/  etfs/ …  cripto/ …
│  │  ├─ simuladores/  simuladores/juros-compostos/
│  │  ├─ ferramentas/  ferramentas/comparador/
│  │  ├─ educacao/  educacao/[trilha]/  educacao/[trilha]/[artigo]/
│  │  ├─ busca/  sobre/  contato/  termos/  privacidade/
│  │  ├─ (em-construcao)/ renda-fixa/ fundos/ opcoes/ carteira/ analises/ noticias/ assistente/ perfil/ entrar/
│  │  └─ api/ market/indicators/route.ts  market/quote/[ticker]/route.ts  market/history/[ticker]/route.ts
│  ├─ components/
│  │  ├─ ui/        Button Card Badge Modal Dropdown Table Tabs Tooltip Input Field Skeleton
│  │  ├─ layout/    Header Footer MobileNav Breadcrumbs SkipLink ThemeToggle Disclaimer
│  │  ├─ market/    AssetCard MetricCard IndicatorStrip DataSourceBadge PriceChange RangeBar
│  │  ├─ charts/    LineChart AreaChart BarChart (wrappers Recharts, carregados sob demanda)
│  │  ├─ illustrations/ HeroOrbit GrowthBars (SVG animados)
│  │  └─ search/    SearchDialog SearchResults
│  ├─ features/
│  │  ├─ compound-interest/  (formulário, resultado, tabela)
│  │  ├─ fixed-income-comparator/
│  │  └─ education/
│  ├─ lib/
│  │  ├─ finance/   compound-interest.ts  rates.ts  fixed-income.ts  tax.ts  (+ *.test.ts)
│  │  ├─ data/      types.ts  service.ts  catalog.ts  providers/{bcb,brapi,demo}.ts  (+ testes)
│  │  ├─ config/    site.ts  env.ts  tax-rules.ts  features.ts  tools.ts
│  │  ├─ security/  rate-limit.ts  headers.ts
│  │  ├─ search/    index.ts (montagem do índice)
│  │  └─ format/    currency.ts  percent.ts  date.ts (Intl pt-BR)
│  └─ middleware.ts (cabeçalhos de segurança, se necessário)
├─ tests/e2e/ (Playwright)
└─ .env.example
```

### 7.3 Padrões de código
- TypeScript com `strict: true` e `noUncheckedIndexedAccess`. Sem `any` não justificado.
- **Funções financeiras puras** em `lib/finance`: sem I/O, sem datas implícitas (o "hoje" entra como parâmetro), totalmente testadas.
- **Server Components por padrão.** `"use client"` só em formulários, gráficos, busca, alternador de tema e menus.
- **Validação com Zod** em três fronteiras: entrada de formulário, parâmetros de rota/API e respostas de APIs externas.
- **Formatação** sempre por `lib/format` (Intl `pt-BR`, BRL, percentuais com vírgula).
- **Erros:** um tipo `Result` ou exceções tipadas na camada de dados. A UI mostra estados de carregamento (Skeleton), vazio e erro. Há `error.tsx` por segmento crítico.
- **Componentes:** variantes via props (por exemplo `Button variant="primary|secondary|ghost"`), sem duplicar componentes por cor.
- ESLint (config do Next + regras de acessibilidade jsx-a11y) e Prettier.

---

## 8. Stack (decidida)

| Escolha | Por quê |
|---|---|
| **Next.js (App Router) + React + TypeScript** | SSR/SSG para SEO e velocidade. Route Handlers como backend que esconde as chaves. Escala para login, carteira e IA. O Astro foi descartado: é ótimo para sites de conteúdo, mas fraco para a interatividade das Fases 2 a 4. |
| **Tailwind CSS v4 + variáveis CSS** | Os tokens permitem os temas claro e escuro sem duplicar estilos. |
| **next-themes** | Tema persistido sem "piscar" e respeitando o sistema. |
| **Recharts** | Gráficos em SVG, acessíveis, suficientes para os simuladores. Na Fase 2, **lightweight-charts** (TradingView, Apache-2.0) para candles. |
| **Zod** | Validação única para formulários, API e respostas externas. |
| **MDX** | Conteúdo educativo versionado, indexável e sem banco. |
| **Vitest + Testing Library** | Testes rápidos de cálculos e componentes. |
| **Playwright + axe** | Navegação, viewports de celular, acessibilidade e cabeçalhos de segurança. |
| **Vercel (Hobby)** | Gratuita, integrada ao Next. |
| **Fase 2:** PostgreSQL (Neon) + Drizzle + Auth.js | Gratuitos, padrão de mercado, migrations versionadas. |

---

## 9. Especificação do MVP

### 9.1 Camada de dados
- Uma interface `MarketDataProvider` com métodos opcionais por capacidade: `getIndicators()`, `getQuote(ticker)`, `getHistory(ticker, range)` e `getFundamentals(ticker)`.
- O `MarketDataService` escolhe o provedor **por classe de ativo e por indicador**, conforme a configuração. Por exemplo: indicadores → BCB; ações, FIIs, ETFs e Ibovespa → brapi se `BRAPI_TOKEN` existir, senão Demo; índices exteriores e cripto → Demo.
- **Todo valor retornado carrega `DataMeta`:**
  ```ts
  type DataSource = 'bcb' | 'brapi' | 'demo';
  interface DataMeta { source: DataSource; isDemo: boolean; asOf: string /* ISO */; attribution: string }
  ```
- O componente **`DataSourceBadge`** lê `DataMeta` e mostra "DADOS DEMONSTRATIVOS" (amarelo) ou "Fonte: Banco Central / brapi · atualizado em <data>" (verde). **Nenhum componente que exibe dado de mercado pode ser renderizado sem `DataMeta`.** O tipo deve obrigar isso, por exemplo com props `{ data: WithMeta<T> }`.
- **DemoProvider:**
  - Preços de partida fixos por ativo em uma fixture.
  - Histórico gerado por um passeio aleatório **determinístico** (semente = ticker), para dar estabilidade entre renderizações e nos testes.
  - `getFundamentals` retorna todos os campos `null`.
- **Falhas:** um provedor real que falha ou devolve dado inválido resulta em `{ status: 'unavailable' }`, com log. **Não** cai para Demo.
- **Cobertura parcial da brapi (decisão do Claude).** A escolha do provedor é **por ativo inteiro**: um ticker atendido pela brapi nunca mistura seções demonstrativas. As seções que o plano gratuito não cobre (por exemplo, histórico longo ou fundamentos) mostram "Dado não disponível" com a nota "não incluído na fonte atual". O BrapiProvider é construído e testado contra **respostas reais gravadas como fixtures**, e os limites do plano gratuito são conferidos e documentados em `API.md`. Se o Ibovespa não estiver disponível no plano gratuito, ele continua demonstrativo e marcado.
- **Cache:** `fetch` com `next: { revalidate }`, de 3600 s para o BCB e 900 s para a brapi.
- **Segredos:** `lib/config/env.ts` valida `process.env` com Zod, só no servidor. O `.env.example` lista `BRAPI_TOKEN=` (opcional).

### 9.2 Tipos centrais (esboço; o builder pode refinar)
```ts
type AssetClass = 'stock'|'fii'|'etf'|'crypto'|'index'|'currency'|'rate';
interface Asset { ticker: string; name: string; class: AssetClass; market: 'BR'|'US'|'CRYPTO'; currency: 'BRL'|'USD'; description?: string }
interface Quote { price: number; change: { day: number|null; week: number|null; month: number|null; year: number|null }; volume: number|null; dayHigh: number|null; dayLow: number|null; high52w: number|null; low52w: number|null }
interface Fundamentals { pl: number|null; pvp: number|null; roe: number|null; roic: number|null; netMargin: number|null; ebitdaMargin: number|null; netDebtToEbitda: number|null; dividendYield: number|null; payout: number|null; revenueCagr5y: number|null; earningsCagr5y: number|null }
```

### 9.3 Catálogo do MVP
O catálogo fica em `lib/data/catalog.ts`. Ele só tem nomes e classes, que não são dados de mercado.
- **Ações:** PETR4, VALE3, ITUB4, WEGE3, BBAS3
- **FIIs:** MXRF11, HGLG11, KNRI11
- **ETFs:** BOVA11, IVVB11
- **Cripto:** BTC, ETH
- **Índices:** Ibovespa, S&P 500, Nasdaq, Dow Jones
- **Moeda:** USD/BRL (PTAX)

### 9.4 Páginas
- **Mercados:** abas ou seções Brasil, Exterior e Cripto.
  - Cada seção traz `IndicatorStrip` e uma tabela (`Table`) com ativo, preço, variação do dia e fonte.
  - "Juros futuros", "Treasuries", "commodities" e "dominância cripto" aparecem como linhas "Dado não disponível — previsto na Fase 2".
- **Página de ativo** (mesmo componente para todas as classes; seções condicionais por classe):
  - cabeçalho com ticker, nome, preço, variação do dia e `DataSourceBadge`;
  - cards de variação (semana, mês, ano);
  - `RangeBar` com mínima, máxima e posição atual;
  - gráfico de histórico (1M, 6M, 1A);
  - indicadores fundamentalistas (ações e FIIs) com tooltip educativo, cada um mostrando o valor ou "Dado não disponível";
  - seção "Riscos desta classe de ativo", com texto educativo genérico por classe e nunca sobre a empresa específica;
  - seções placeholder para dividendos, notícias e eventos;
  - aviso padrão;
  - um ticker fora do catálogo leva a `notFound()`.
- **Listas por classe:** grade de `AssetCard`.
- **Páginas "em construção":** um componente único `ComingSoon` recebe título, fase e descrição, e mostra links úteis.

### 9.5 Simulador de juros compostos
- **Entradas:**
  - capital inicial ≥ 0;
  - aporte mensal ≥ 0;
  - taxa ≥ 0, com **seletor ao mês / ao ano**;
  - prazo em meses ou anos, de 1 a 600 meses.
- **Validação com Zod:** limites razoáveis (por exemplo valores ≤ 1e12 e taxa ≤ 100% a.m.), mensagens em português e erros associados aos campos por `aria-describedby`.
- **Modelo:**
  - capitalização mensal, com aporte no **fim** de cada mês;
  - conversão de taxa anual para mensal por equivalência: `i_m = (1 + i_a)^(1/12) − 1`;
  - fórmula: `VF = P·(1+i)^n + A·((1+i)^n − 1)/i`, com o caso `i = 0` tratado como `VF = P + A·n`;
  - a tabela mês a mês é calculada iterativamente e precisa **bater com a fórmula fechada** (teste).
- **Saídas:**
  - patrimônio final, total investido e juros acumulados;
  - gráfico de área empilhada (investido × juros) ao longo do tempo;
  - tabela anual expansível.
- **Sem correção pela inflação no MVP.** Deixar uma nota "valores nominais".
- O estado do formulário fica refletido na URL (query string), para que a simulação possa ser compartilhada.

### 9.6 Comparador de renda fixa
- **Entradas:**
  - valor;
  - prazo em dias corridos, mínimo 30;
  - % do CDI do CDB (padrão 100%);
  - % do CDI da LCI/LCA (padrão 90%).
- **Taxas de referência:** vêm da camada de dados (BCB), com a data exibida. Se estiverem indisponíveis, o usuário pode informar Selic e CDI manualmente. Isso fica marcado na tela como "taxas informadas pelo usuário".
- **Modelos** (todos em `lib/finance/fixed-income.ts`, puros e testados):
  - **Dias úteis:** aproximação `du = round(dc × 252/365)`, exibida como premissa.
  - **CDB:** `(1 + CDI·p)^(du/252)`, com IR regressivo sobre o rendimento conforme a tabela de `tax-rules.ts`.
  - **Tesouro Selic:** rende a Selic (aproximação sem ágio/deságio), tem IR regressivo e taxa de custódia B3 conforme `tax-rules.ts`.
  - **LCI/LCA:** `% do CDI` sem IR, conforme a regra vigente em `tax-rules.ts`. **Prazo mínimo de carência (decisão do Claude):** as regras do CMN de 2024 impõem prazos mínimos à LCI e à LCA. Os valores ficam em `tax-rules.ts` (`minHoldingDays`, a conferir na fonte oficial). Se o prazo simulado for menor, a linha continua na tabela com a mensagem "não disponível para este prazo (carência mínima de N dias)" e fica fora do gráfico e do destaque. O prazo mínimo geral do comparador continua 30 dias. O teste cobre os dois lados da carência.
  - **Poupança:** se a Selic meta for maior que 8,5% a.a., rende 0,5% a.m. + TR; caso contrário, 70% da Selic meta ao ano, mensalizada, + TR. A TR vem do BCB (ou é 0, com aviso, se indisponível). Rende por meses completos e é isenta de IR.
  - **IOF:** como o prazo mínimo é 30 dias, não se aplica. Essa premissa fica exibida.
- **`tax-rules.ts`** contém as faixas do IR regressivo (22,5% até 180 dias; 20% de 181 a 360; 17,5% de 361 a 720; 15% acima de 720), a regra de isenção de LCI/LCA para pessoa física, a custódia do Tesouro e a regra da poupança. Cada regra tem `effectiveFrom`, `source` (URL oficial) e `verifiedAt`. **Antes do MVP ficar pronto, o builder confere cada regra na fonte oficial** (Receita Federal, Tesouro Direto, BCB) e atualiza `verifiedAt`. Se encontrar divergência com este documento, vale a fonte oficial, e a divergência é registrada.
- **Saídas:**
  - tabela comparativa com valor bruto, imposto, custos, valor líquido, rentabilidade líquida no período e equivalente ao ano, liquidez, risco e cobertura do FGC;
  - gráfico de barras com os valores líquidos;
  - destaque neutro do maior valor líquido, com a frase "maior valor líquido nesta simulação", nunca "melhor investimento".
- As colunas qualitativas (liquidez, risco, FGC) vêm de uma tabela estática, documentada e com fonte.

### 9.7 Educação
- **MVP:** 3 trilhas × 3 artigos originais, escritos para o projeto (sem copiar terceiros):
  - **Iniciante:** juros compostos e inflação; risco, retorno e liquidez; renda fixa básica (CDB, Tesouro, LCI/LCA, FGC).
  - **Intermediário:** indicadores fundamentalistas (P/L, P/VP, ROE, DY); FIIs; ETFs e diversificação.
  - **Avançado:** introdução a opções (call, put, strike, prêmio); volatilidade e gregas (conceito); gestão de risco e tamanho de posição.
- **Frontmatter de cada artigo:** título, descrição, nível, trilha, tempo de leitura, data de atualização e termos relacionados (para tooltips e busca).
- Cada artigo termina com links para as ferramentas relacionadas e com o aviso padrão.

### 9.8 Busca global
- O índice é **montado no build** a partir do catálogo, dos artigos, das ferramentas e das páginas.
- A busca roda no cliente, ignorando acentos e caixa, e procura em ticker, nome, título e palavras-chave.
- Abre com o botão no header e com **Ctrl/⌘+K**. O diálogo é acessível (foco preso, Esc fecha, navegação por setas). Os resultados são agrupados por tipo.
- A rota `/busca?q=` faz a mesma busca e torna os resultados compartilháveis e indexáveis.

### 9.9 Monetização (só preparação)
- `lib/config/features.ts` registra os recursos com o plano mínimo (`free | premium | pro`), conforme o prompt original.
- A função `canAccess(feature, user?)` devolve `true` para tudo no MVP.
- Não há UI de cobrança.

---

## 10. Requisitos transversais

### 10.1 Segurança
- Cabeçalhos de segurança: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` e HSTS (Vercel).
- **Escolha de CSP (decisão do Claude):** as páginas continuam **estáticas** (SSG/ISR), por SEO e performance. Por isso **não** se usa nonce, porque no Next.js o nonce obriga a renderização dinâmica. A CSP fica com `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (necessário para os scripts inline do Next e do next-themes), `style-src 'self' 'unsafe-inline'`, `img-src 'self' data:`, `connect-src 'self'`, `font-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` e `frame-ancestors 'none'`. O risco de XSS é mitigado na origem: não há HTML de terceiros nem entrada do usuário renderizada como HTML. Esse trade-off fica registrado como ADR em `ARCHITECTURE.md`. Na Fase 2, com sessão, reavaliar o uso de nonce nas rotas autenticadas, que já serão dinâmicas.
- **Rotas `/api/*`:** só GET no MVP. Validação de parâmetros com Zod, rate limit por IP (em memória, documentado), respostas de erro sem stack trace e cabeçalhos de cache.
- **Sem `dangerouslySetInnerHTML`**, exceto o JSON-LD, que é serializado com escape.
- O MDX é conteúdo do próprio repositório, portanto confiável. Nenhum HTML de terceiros é renderizado.
- **CSRF:** não se aplica no MVP (sem mutações nem sessão). Na Fase 2, fica a cargo do Auth.js com cookies SameSite.
- **Logs:** um logger simples em JSON no servidor (nível, evento, provedor, duração). Nunca loga segredos.

### 10.2 SEO
- `metadata` e `generateMetadata` por rota (title, description, canonical, Open Graph, Twitter), com template de título `%s | Prisma`.
- `sitemap.ts`, que inclui catálogo, artigos e páginas, e `robots.ts`.
- **JSON-LD:**
  - `WebSite` com `SearchAction` na Home;
  - `Article` nos artigos;
  - `BreadcrumbList` nas páginas internas.
- URLs amigáveis em minúsculas (`/acoes/petr4`). Um `<h1>` por página e hierarquia de títulos correta.
- Páginas de ativo e de artigo são estáticas (SSG/ISR) para serem indexáveis.

### 10.3 Performance e acessibilidade
- **Metas no Lighthouse (celular), para Home, ativo e simulador:** Performance ≥ 90, Acessibilidade ≥ 95, SEO ≥ 95, Boas práticas ≥ 95.
- Recharts e o diálogo de busca são carregados sob demanda (`next/dynamic`).
- Imagens via `next/image` (haverá poucas; as ilustrações são SVG inline).
- **Acessibilidade:**
  - navegação completa por teclado e foco sempre visível;
  - `label` em todos os campos e `aria-live` nos resultados dos simuladores;
  - gráficos com título, descrição e uma tabela equivalente acessível;
  - SVGs decorativos com `aria-hidden` e SVGs informativos com `role="img"` e `aria-label`;
  - contraste AA nos dois temas.

### 10.4 Avisos
Texto padrão (componente `Disclaimer`):
> As informações disponibilizadas nesta plataforma possuem finalidade educacional e informativa. Simulações e análises não constituem recomendação individual de investimento. Rentabilidade passada não garante resultados futuros. Investimentos envolvem riscos.

O aviso aparece no rodapé global e em versão destacada nos simuladores, no comparador e nas páginas de ativo.

---

## 11. Etapas 5 e 6 — Testes e documentação

### 11.1 Testes (critério de pronto do MVP)

**Unitários (Vitest):**
- **Juros compostos:**
  - fórmula fechada contra valores de referência calculados à parte e registrados no teste com a origem do cálculo;
  - caso `i = 0`;
  - conversão de taxa anual para mensal;
  - tabela iterativa igual à fórmula;
  - limites da validação.
- **Renda fixa:**
  - todas as faixas de IR, incluindo as bordas 180/181, 360/361 e 720/721;
  - regra da poupança dos dois lados de 8,5%;
  - LCI isenta;
  - custódia do Tesouro;
  - aproximação de dias úteis.
- **Camada de dados:**
  - BCB com resposta de exemplo (fixture gravada a partir da API real);
  - resposta inválida resulta em `unavailable`;
  - Demo é determinístico e sempre marca `isDemo: true`;
  - Demo não retorna fundamentos;
  - seleção de provedor com e sem `BRAPI_TOKEN`.
- **Formatação** pt-BR.
- **Busca:** acentos, caixa, ticker.

**Componentes (Testing Library):**
- `DataSourceBadge` nos dois estados;
- `MetricCard` com `null` mostrando "Dado não disponível";
- formulário do simulador com mensagens de erro acessíveis;
- `ThemeToggle`.

**E2E (Playwright), em desktop (1280px) e celular (375px):**
- todas as rotas da seção 4.2 respondem 200 e têm `<h1>`;
- ticker inexistente leva a 404;
- menu mobile abre, fecha e navega;
- busca por Ctrl+K encontra "PETR4" e um artigo;
- simulador calcula e reflete os valores na URL;
- comparador funciona com as taxas manuais (com a rede do BCB bloqueada);
- tema persiste após recarregar;
- **nenhuma rolagem horizontal em 375px**;
- **axe sem violações sérias ou críticas** nas páginas principais;
- cabeçalhos de segurança presentes;
- `/api/market/quote/XXXX` inválido responde 400; excesso de requisições responde 429;
- todo valor demonstrativo visível na Home está dentro de um bloco com o selo "DADOS DEMONSTRATIVOS".

Testes que dependem da rede real ficam marcados como `@live` e fora da suíte padrão.

### 11.2 Documentação
- **`README.md`:** o que é, aviso, como rodar (`npm install`, `npm run dev`), variáveis de ambiente, scripts, como testar, deploy, prints.
- **`docs/ARCHITECTURE.md`:** camadas, fluxo de dados, `DataMeta`, decisões e o porquê de cada uma (resumo da seção 8, em formato de ADRs curtos).
- **`docs/ROADMAP.md`:** seção 12 deste documento, mantida viva.
- **`docs/API.md`:** rotas internas `/api/*` (parâmetros, respostas, erros, limites) e fontes externas (endpoints, séries, termos de uso, cache).
- **`docs/DATABASE.md`:** "sem banco no MVP" e o esquema planejado da Fase 2 (tabelas `users`, `accounts`, `sessions`, `user_preferences`, `watchlists`, `watchlist_items`, `portfolios`, `positions`, `transactions`, `investor_profiles`, `alerts`), com chaves, índices e regras de LGPD.

Ao fim de cada etapa da implementação, o builder relata ao Fabio: o que foi criado, os arquivos alterados, como testar, as limitações e o próximo passo recomendado (pedido explícito do prompt original).

---

## 12. Etapa 3 — Roadmap

| Fase | Entra | Critério de saída |
|---|---|---|
| **MVP (Fase 1)** | Tudo da seção 9; páginas legais e "em construção"; testes e documentação da seção 11; projeto **pronto para deploy** na Vercel | Suíte verde, metas do Lighthouse medidas no build de produção local (`next build && next start`), passo a passo de publicação (GitHub + Vercel) no README. A publicação em si acontece quando Fabio tiver as contas: o Claude conduz pelo terminal e Fabio faz os logins |
| **Fase 2: conta e dados** | Auth.js + Postgres/Drizzle; preferências (nível, tema); watchlist, favoritos e histórico; carteira manual com distribuição; perfil de investidor orientativo; simuladores de aposentadoria, independência financeira, renda passiva, inflação, financiamento/amortização (SAC e Price) e dividendos; FIIs, fundos e ETFs com dados da CVM; cripto via CoinGecko; Tesouro Direto real; candles + indicadores técnicos (lightweight-charts); notícias por RSS; rate limit via Upstash | Usuário cria conta, monta carteira e watchlist; LGPD documentada |
| **Fase 3: análise avançada** | Opções: Black-Scholes, gregas e simulador de payoff (compra de call/put, venda coberta, protective put, trava de alta/baixa, straddle, strangle, collar) com gráfico, break-even, risco e ganho máximos e alertas de risco; screener e rankings com critérios explícitos; comparador avançado (FII × ação, ETF × fundo); alertas e notificações; **Assistente de Investimentos** (Claude API, com respostas baseadas no conteúdo da plataforma e nos cálculos de `lib/finance` como ferramentas, citando fontes e se recusando a recomendar compra ou venda) | Cálculos de opções testados contra valores de referência |
| **Fase 4: plataforma** | Planos Gratuito, Premium e Profissional (cobrança via Stripe, usando `features.ts`); relatórios em PDF; API pública com chave; comunidade e comentários com moderação; observabilidade (Sentry); cache distribuído | A definir quando chegar lá |

---

## 13. Decisões que ficam para o builder
- Biblioteca exata de MDX e de leitura de frontmatter.
- Detalhes visuais finos (espaçamentos, raios, sombras) dentro dos tokens e do mockup.
- Algoritmo de busca: correspondência simples normalizada ou uma biblioteca leve de busca aproximada.
- Forma exata do `Result` e do logger.
- Ordem interna das tarefas, desde que cada etapa entregue algo testável e relatado.
- Texto dos artigos educativos, original e revisado para não conter recomendação.

## 14. Decisões tomadas pelo Claude (para Fabio conferir)
1. Nome provisório "Prisma", centralizado em `siteConfig`.
2. npm como gerenciador de pacotes; hospedagem na Vercel.
3. Sem banco e sem login no MVP. Rotas não implementadas aparecem como "em construção".
4. brapi.dev opcional por token. Sem token, ações e índices B3 ficam demonstrativos. **O padrão do MVP é sem token.** O BrapiProvider é testado com fixtures gravadas e passa a valer quando Fabio criar a conta e colocar `BRAPI_TOKEN` no `.env.local`.
13. CSP sem nonce, para manter as páginas estáticas (seção 10.1).
14. Ativo atendido pela brapi nunca mistura seções demonstrativas (seção 9.1).
15. LCI/LCA abaixo da carência mínima aparece como "não disponível para este prazo" (seção 9.6).
16. O MVP termina "pronto para deploy". A publicação depende das contas do Fabio (seção 12).
5. Fonte real que falha **não** cai para dado demonstrativo: mostra "indisponível".
6. Modo demonstrativo simula só preço e histórico. Indicadores fundamentalistas ficam sempre como "Dado não disponível".
7. Rotas `/acoes/petr4`, `/fiis/mxrf11` etc. em vez de `/ativos/...`, pelo SEO e para casar com o menu.
8. Comparador com prazo mínimo de 30 dias (sem IOF) e aproximação de dias úteis 252/365.
9. Simulador com aporte no fim do mês e valores nominais (sem inflação).
10. Educação no MVP: 9 artigos (3 por trilha).
11. Animações em loop só no hero; o resto anima uma vez ao aparecer na tela.
12. Catálogo de 16 itens listado na seção 9.3.
