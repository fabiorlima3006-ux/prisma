# Banco de dados

## MVP: sem banco

O MVP **não tem banco de dados** e não coleta dados de usuário. O catálogo de ativos (`src/lib/data/catalog.ts`) e o conteúdo educativo (`content/`, MDX) são arquivos versionados no repositório. A única persistência é a preferência de tema em `localStorage`, no navegador.

## Fase 2: esquema planejado

- **Banco:** PostgreSQL (Neon, plano gratuito). **ORM:** Drizzle, com migrations versionadas. **Autenticação:** Auth.js (adaptador Drizzle).
- **Convenções:** chaves primárias `uuid` (`gen_random_uuid()`), exceto onde indicado; datas em `timestamptz` (UTC); valores monetários em `numeric(20,8)` (sem ponto flutuante); `created_at`/`updated_at` em todas as tabelas; nomes de tabela e coluna em inglês, no plural e em `snake_case`.
- Todas as tabelas de dados do usuário têm `user_id uuid not null references users(id) on delete cascade`, de modo que a exclusão da conta apaga tudo em cascata.

### users
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | **PK** |
| `email` | text | not null, **unique** |
| `email_verified` | timestamptz | |
| `name` | text | opcional |
| `image` | text | opcional |
| `plan` | text | `free` / `premium` / `pro`, padrão `free` (ver `features.ts`) |
| `created_at`, `updated_at` | timestamptz | |
| `deleted_at` | timestamptz | marca a solicitação de exclusão (ver LGPD) |

### accounts (provedores OAuth, padrão Auth.js)
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | **PK** |
| `user_id` | uuid | **FK** users.id, on delete cascade |
| `provider`, `provider_account_id` | text | **unique** (`provider`, `provider_account_id`) |
| `type` | text | |
| `access_token`, `refresh_token`, `id_token` | text | criptografados em repouso; só se o provedor exigir |
| `expires_at` | integer | |

Índice: `user_id`.

### sessions
| Coluna | Tipo | Notas |
|---|---|---|
| `session_token` | text | **PK** |
| `user_id` | uuid | **FK** users.id, on delete cascade |
| `expires` | timestamptz | not null |

Índices: `user_id`, `expires` (limpeza de sessões vencidas).

### user_preferences
| Coluna | Tipo | Notas |
|---|---|---|
| `user_id` | uuid | **PK** e **FK** users.id (1:1) |
| `level` | text | `beginner` / `intermediate` / `advanced` |
| `theme` | text | `light` / `dark` / `system` |
| `updated_at` | timestamptz | |

### watchlists
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | **PK** |
| `user_id` | uuid | **FK** users.id |
| `name` | text | not null |
| `created_at` | timestamptz | |

Índice: `user_id`. **unique** (`user_id`, `name`).

### watchlist_items
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | **PK** |
| `watchlist_id` | uuid | **FK** watchlists.id, on delete cascade |
| `ticker` | text | not null (código do catálogo) |
| `added_at` | timestamptz | |

Índice: **unique** (`watchlist_id`, `ticker`).

### portfolios
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | **PK** |
| `user_id` | uuid | **FK** users.id |
| `name` | text | not null |
| `base_currency` | text | `BRL` por padrão |
| `created_at`, `updated_at` | timestamptz | |

Índice: `user_id`.

### positions
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | **PK** |
| `portfolio_id` | uuid | **FK** portfolios.id, on delete cascade |
| `ticker` | text | not null |
| `asset_class` | text | `stock`, `fii`, `etf`, `crypto`, `fixed_income`... |
| `quantity` | numeric(20,8) | not null, `>= 0` |
| `average_price` | numeric(20,8) | calculado a partir das transações |

Índices: **unique** (`portfolio_id`, `ticker`); `portfolio_id`.

### transactions
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | **PK** |
| `portfolio_id` | uuid | **FK** portfolios.id, on delete cascade |
| `ticker` | text | not null |
| `type` | text | `buy`, `sell`, `dividend`, `fee` (registro do usuário; não é recomendação) |
| `quantity` | numeric(20,8) | |
| `price` | numeric(20,8) | |
| `fees` | numeric(20,8) | padrão 0 |
| `executed_at` | date | data informada pelo usuário |
| `created_at` | timestamptz | |

Índices: (`portfolio_id`, `executed_at`); (`portfolio_id`, `ticker`).

### investor_profiles
| Coluna | Tipo | Notas |
|---|---|---|
| `user_id` | uuid | **PK** e **FK** users.id (1:1) |
| `answers` | jsonb | respostas do questionário |
| `result` | text | `conservative` / `moderate` / `bold` (orientativo) |
| `completed_at` | timestamptz | |

O perfil é **orientativo** e não substitui a avaliação de um profissional (CVM, Resolução 30/2021).

### alerts
| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | **PK** |
| `user_id` | uuid | **FK** users.id |
| `ticker` | text | not null |
| `condition` | text | `above` / `below` |
| `threshold` | numeric(20,8) | |
| `channel` | text | `email` |
| `active` | boolean | padrão true |
| `last_triggered_at` | timestamptz | |
| `created_at` | timestamptz | |

Índices: `user_id`; (`active`, `ticker`) para o job que avalia os alertas.

### Diagrama de relações

```
users 1--N accounts
users 1--N sessions
users 1--1 user_preferences
users 1--1 investor_profiles
users 1--N watchlists 1--N watchlist_items
users 1--N portfolios 1--N positions
                      1--N transactions
users 1--N alerts
```

## LGPD (Lei 13.709/2018)

- **Minimização:** coletar só e-mail (e nome, se vier do provedor OAuth). Sem CPF, telefone ou endereço. Carteira e transações guardam apenas o que o usuário digita. Nenhum dado de terceiros.
- **Base legal:** execução de contrato (conta, preferências, carteira, watchlist e alertas pedidos pelo usuário) e consentimento (e-mails de alerta e qualquer comunicação opcional), registrado e revogável. A Política de Privacidade passa a descrever finalidades, compartilhamento (provedor de e-mail, hospedagem, banco) e direitos.
- **Retenção:** dados da conta e da carteira são mantidos enquanto a conta existir. Sessões vencidas são apagadas automaticamente. Alertas inativos e contas sem acesso por 24 meses geram aviso por e-mail e exclusão em 30 dias se não houver resposta. Logs técnicos sem dados pessoais, por até 90 dias.
- **Exclusão de conta:** botão "Excluir minha conta" em `/perfil`. A ação define `users.deleted_at`, revoga as sessões e, em até 30 dias (prazo para desfazer o pedido), executa `DELETE FROM users WHERE id = ...`, que apaga em cascata todas as tabelas acima. Backups são sobrescritos no ciclo normal (até 35 dias).
- **Direitos do titular:** acesso e portabilidade por exportação em JSON (todas as tabelas do usuário); correção pelo próprio perfil; eliminação como descrito acima; revogação de consentimento nas preferências.
- **Segurança:** conexão TLS com o banco, segredos só em variáveis de ambiente, tokens OAuth criptografados em repouso, consultas sempre parametrizadas (Drizzle), acesso a linhas sempre filtrado por `user_id` da sessão.
- **Cookies:** apenas os estritamente necessários (sessão) e a preferência de tema. Sem rastreadores de terceiros.
