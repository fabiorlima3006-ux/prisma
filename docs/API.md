# API e fontes de dados

Este documento descreve as rotas internas da plataforma, as fontes externas de dados e a política "sem fallback".

## 1. Rotas internas

Todas as rotas ficam em `/api/market/*`, aceitam apenas `GET` e respondem JSON.

| Rota | Parâmetros | Resposta 200 |
|---|---|---|
| `/api/market/indicators` | nenhum | Objeto indexado por `IndicatorId` (`selic`, `cdi`, `ipca12m`, `ipcaMonth`, `ptax`, `tr`). Cada valor é um `DataResult<IndicatorValue>`. |
| `/api/market/quote/{ticker}` | `ticker` no caminho | `DataResult<Quote>` |
| `/api/market/history/{ticker}?range=` | `ticker` no caminho; `range` = `1m`, `6m` ou `1y` (padrão `1y`) | `DataResult<PricePoint[]>` |

O `ticker` é resolvido no catálogo (`src/lib/data/catalog.ts`) sem diferenciar maiúsculas de minúsculas, pelo código ou pelo slug (`petr4` resolve para `PETR4`). O formato aceito é `^[A-Za-z0-9^.]{1,12}$`.

Um `DataResult<T>` é `{ status: 'ok', data, meta }` (com `meta.source`, `meta.isDemo`, `meta.asOf`, `meta.attribution`) ou `{ status: 'unavailable', reason, source, attribution }`. Uma fonte indisponível **não** gera erro HTTP: a rota responde 200 com `status: 'unavailable'`.

### Códigos de status

| Código | Corpo | Quando |
|---|---|---|
| 200 | `DataResult` ou objeto de indicadores | Sucesso, inclusive quando o dado está indisponível |
| 400 | `{ "error": "invalid-ticker" }` | Ticker fora do formato aceito |
| 400 | `{ "error": "invalid-range" }` | `range` diferente de `1m`, `6m` e `1y` |
| 404 | `{ "error": "not-found" }` | Ticker com formato válido, mas fora do catálogo |
| 429 | `{ "error": "rate-limited" }` | Limite estourado; vem com o cabeçalho `Retry-After` (segundos) |
| 500 | `{ "error": "internal" }` | Erro inesperado. A resposta nunca traz stack; o detalhe vai para o log (`api-internal-error`) |

### Cache

Respostas 200 trazem `Cache-Control: public, s-maxage=900, stale-while-revalidate=3600`. Erros (400, 404, 429, 500) não trazem esse cabeçalho.

### Rate limit

- 60 requisições por minuto por IP, compartilhadas pelas três rotas (um único limitador).
- A chave é o primeiro IP do cabeçalho `x-forwarded-for`; sem o cabeçalho, todos os clientes caem em `unknown` e dividem o mesmo contador.
- Janela fixa de 60 s. O `Retry-After` indica o tempo até o fim da janela.
- **Limitação:** o contador fica em memória, **por instância** do servidor. Em ambiente serverless ou com várias instâncias, cada uma conta separadamente (o limite efetivo é maior que 60) e o contador zera a cada cold start. É uma proteção básica contra abuso, não uma garantia. Para um limite global, será preciso um armazenamento compartilhado (por exemplo, Redis), previsto para a Fase 2.

### Cabeçalhos de segurança

Aplicados a todas as páginas e rotas por `next.config.ts` (`src/lib/security/headers.ts`): `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` e `Strict-Transport-Security`. Em desenvolvimento (`NODE_ENV !== 'production'`), o `script-src` ganha `'unsafe-eval'`; em produção, não.

## 2. Fontes externas

### 2.1 BCB SGS (indicadores)

- Base: `https://api.bcb.gov.br` (configurável por `BCB_BASE_URL`). Endpoint: `/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/1?formato=json`. Sem autenticação.
- Revalidação de 3600 s; timeout de 5000 ms.
- Séries conferidas em 2026-11-07:

| Indicador | Série | Unidade | Descrição | Observações |
|---|---|---|---|---|
| `selic` | 432 | a.a. | Meta Selic | Usa consulta com datas limitadas (`dataInicial` = hoje menos 30 dias, `dataFinal` = hoje) e pega a última linha com data menor ou igual a hoje. Motivo: `ultimos/1` pode devolver uma vigência futura (a API retornou 09/12/2026). |
| `cdi` | 4389 | a.a. | CDI anualizado, base 252 | |
| `ipcaMonth` | 433 | a.m. | IPCA, variação mensal | |
| `ipca12m` | 13522 | a.a. | IPCA acumulado em 12 meses | Mesmo mês de referência da série 433. |
| `ptax` | 1 | BRL | Dólar, taxa de venda | Confere com a cotação de venda da PTAX no Olinda. |
| `tr` | 226 | a.m. | Taxa Referencial | Uma linha por dia, com taxa mensal e janela `[data, dataFim]`. As linhas trazem o campo extra `dataFim`, ignorado pelo schema. |

- Datas vêm em `DD/MM/AAAA` e são convertidas para `AAAA-MM-DD`. Taxas são convertidas de percentual para fração (13,75 vira 0,1375).
- Resposta vazia (`[]`), valor vazio ou data ilegível resultam em `unavailable` (`empty` ou `invalid-response`), nunca em erro de build.

### 2.2 brapi (cotações, histórico e P/L)

- Endpoint: `GET https://brapi.dev/api/quote/{simbolo}?range=&interval=`. Documentação: <https://brapi.dev/docs/acoes>.
- Autenticação: cabeçalho `Authorization: Bearer <BRAPI_TOKEN>`. O token é opcional e fica só em `.env.local`. Sem token, o provedor brapi nem é registrado e os ativos usam o modo demonstrativo.
- Sem token, a própria brapi libera apenas os tickers de teste `PETR4`, `MGLU3`, `VALE3` e `ITUB4`, e **somente um por requisição** (combinar com outro exige token). Qualquer outro ticker responde 401 `MISSING_TOKEN`. O índice `^BVSP` (Ibovespa) exige token e **não foi verificado ao vivo**.
- Limites do plano gratuito: a documentação consultada não informa requisições por mês, tickers por requisição nem profundidade do histórico. Sabe-se que o plano define quais `range`, `interval` e módulos são aceitos (valores fora do plano retornam erro) e que `includeRaw` é exclusivo do plano Pro. Confirmar os números e os termos de uso na página de preços da brapi antes de publicar.
- Uso: a cotação usa `range=1y` (uma requisição, de onde saem as variações de semana, mês e ano); o histórico usa `1mo`, `6mo` ou `1y`. Do bloco de fundamentos, só `priceEarnings` (P/L) é mapeado.
- Revalidação de 900 s; timeout de 5000 ms.

### 2.3 Demonstrativo (demo)

- Gerado localmente, sem rede: caminhada aleatória determinística, com gerador `mulberry32` semeado pelo hash FNV-1a do ticker, volatilidade diária de 1,5%, base 100 (10000 para índices) e 252 dias úteis.
- Só simula preço, cotação e histórico. Indicadores e fundamentos nunca são simulados: aparecem como "Dado não disponível".
- Todo dado demonstrativo traz `meta.isDemo = true` e a UI exibe o selo **DADOS DEMONSTRATIVOS**.

## 3. Política "sem fallback"

Uma fonte real que falha **não** cai para dado demonstrativo. O resultado é `status: 'unavailable'` (com `reason` `fetch-failed`, `invalid-response`, `not-provided` ou `empty`) e a UI mostra "Dado indisponível no momento". O dado demonstrativo só aparece quando o ativo é atendido pelo modo demo desde o início (sem `BRAPI_TOKEN`), nunca como substituto de uma falha, e sempre com o selo **DADOS DEMONSTRATIVOS**. Um mesmo ativo nunca mistura seções reais e demonstrativas.
