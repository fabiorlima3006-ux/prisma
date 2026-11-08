# Roadmap

Documento vivo. Baseado na seção 12 do spec (`docs/superpowers/specs/2026-11-07-plataforma-investimentos-design.md`).

## Fases

| Fase | Entra | Critério de saída | Estado |
|---|---|---|---|
| **MVP (Fase 1)** | Tudo da seção 9 do spec; páginas legais e "em construção"; testes e documentação; projeto **pronto para deploy** na Vercel | Suíte verde, metas do Lighthouse medidas no build de produção local, passo a passo de publicação (GitHub + Vercel) no README. A publicação em si acontece quando Fabio tiver as contas | **Concluído em 2026-11-08** (publicação pendente, ver abaixo) |
| **Fase 2: conta e dados** | Auth.js + Postgres/Drizzle; preferências (nível, tema); watchlist, favoritos e histórico; carteira manual com distribuição; perfil de investidor orientativo; simuladores de aposentadoria, independência financeira, renda passiva, inflação, financiamento/amortização (SAC e Price) e dividendos; FIIs, fundos e ETFs com dados da CVM; cripto via CoinGecko; Tesouro Direto real; candles + indicadores técnicos (lightweight-charts); notícias por RSS; rate limit via Upstash | Usuário cria conta, monta carteira e watchlist; LGPD documentada | Planejado (esquema em `DATABASE.md`) |
| **Fase 3: análise avançada** | Opções: Black-Scholes, gregas e simulador de payoff (compra de call/put, venda coberta, protective put, trava de alta/baixa, straddle, strangle, collar) com gráfico, break-even, risco e ganho máximos e alertas de risco; screener e rankings com critérios explícitos; comparador avançado (FII × ação, ETF × fundo); alertas e notificações; **Assistente de Investimentos** (Claude API, com respostas baseadas no conteúdo da plataforma e nos cálculos de `lib/finance` como ferramentas, citando fontes e se recusando a recomendar compra ou venda) | Cálculos de opções testados contra valores de referência | Planejado |
| **Fase 4: plataforma** | Planos Gratuito, Premium e Profissional (cobrança via Stripe, usando `features.ts`); relatórios em PDF; API pública com chave; comunidade e comentários com moderação; observabilidade (Sentry); cache distribuído | A definir quando chegar lá | Planejado |

## MVP: o que foi entregue

- [x] Camada de dados (BCB real, brapi opcional, demonstrativo) com `DataResult`/`DataMeta` e política "sem fallback".
- [x] Funções financeiras puras e testadas (juros compostos, IR regressivo, comparador de renda fixa).
- [x] Rotas internas `/api/market/*` com validação, cache e rate limit (documentadas em `API.md`).
- [x] Design system, tema claro e escuro, hero em canvas, páginas de mercados e de ativos.
- [x] Simulador de juros compostos e comparador de renda fixa.
- [x] Educação (9 artigos em MDX), busca global, SEO, páginas legais, rotas "em construção".
- [x] Testes unitários, E2E (desktop e celular, axe) e Lighthouse medido.
- [x] Documentação: README, ARCHITECTURE, API, DATABASE, ROADMAP.
- [x] `features.ts` com o registro de planos (sempre liberado no MVP).

## Pendências do MVP

**Dependem do Fabio**
- [x] Repositório no GitHub e deploy na Vercel: https://prisma-b8wz.vercel.app (2026-11-08).
- [ ] Cadastrar `BRAPI_TOKEN` na Vercel (dados reais de ações) e refazer o deploy. `NEXT_PUBLIC_SITE_URL` não é mais necessária (usa o domínio de produção da Vercel).
- [x] Usuário do GitHub em `siteConfig.links.github` (aparece em `/contato`): `fabiorlima3006-ux`.
- [ ] Confirmar na página de preços da brapi os limites e os termos do plano gratuito.
- [ ] Performance mobile no site publicado: 84 a 87 de mediana (meta 90; TBT da hidratação). Conferir no PageSpeed Insights e reduzir o JavaScript do cliente na Fase 2.

**Pequenos ajustes de conteúdo e qualidade, recomendados antes do lançamento**
- [ ] Artigo de volatilidade e gregas (`volatilidade-e-gregas`, linha ~28): trocar "put americana" por redação correta ("opção de venda de estilo americano").
- [ ] Definição de P/L: a UI e o artigo falam em preço por ação; a definição canônica é valor de mercado / lucro TTM. Alinhar o texto.
- [ ] Citar a base regulatória da distribuição de proventos de FII no conteúdo sobre FIIs.
- [ ] Caractere inválido (U+FFFD) no comentário de `vitest.setup.ts` (linha 7, "não").
- [ ] Revisar a data de vigência da custódia do Tesouro e o `verifiedAt` calculado em `tax-rules.ts`; documentar a fonte de "LCA 12 meses se indexada".
- [ ] Reavaliar a indexação de `/busca` (hoje `noindex`) na revisão final de SEO.
- [ ] Tratar voltar/avançar do navegador no simulador (hoje não ressincroniza o formulário) e levar o estado do comparador para a URL.

**Dívida técnica menor (sem urgência)**
- [ ] Tooltip fechando com Esc sem foco (WCAG 1.4.13), Dropdown que não fecha ao sair com Tab, Esc global competindo com Dropdown aberto.
- [ ] Testes: tabela `sr-only` do comparador, cobertura de `AbortSignal` nos provedores, rotas 500 de history/indicators, CSP de produção.
- [ ] Lista estática do sitemap mantida à mão, sem teste cruzado com as rotas.
- [ ] Rate limit: `maxKeys: 0` excede por 1; varredura O(n) sob flood.
- [ ] Precisão de `(g−1)/i` para taxas muito pequenas (usar `expm1`/`log1p`).

## Próximo passo recomendado

Publicar (GitHub + Vercel) e remedir o Lighthouse; depois iniciar a Fase 2 pelas preferências e watchlist, que exigem o banco descrito em `DATABASE.md`.
