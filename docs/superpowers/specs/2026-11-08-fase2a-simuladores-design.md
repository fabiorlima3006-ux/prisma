# Fase 2A: simuladores — design

**Data:** 2026-11-08 · **Base:** spec do MVP (`2026-11-07-plataforma-investimentos-design.md`), que continua valendo em tudo o que este documento não muda.

## 1. Intenção

Fabio, sobre a pessoa que volta ao Prisma: ela quer **"simular questões financeiras e de investimento"** e **"ver notícias atualizadas"**. A conta concreta citada: **"quanto valor x investido vai render após x anos"**.

A Fase 2 do ROADMAP foi dividida. Esta parte (2A) cobre só **simuladores**. Notícias são a parte 2B, com spec próprio. Conta de usuário, carteira e watchlist ficam para depois.

Fabio delegou as decisões ("prossiga conforme achar melhor"). Todas as escolhas abaixo são do Claude.

## 2. Objetivos

1. Responder "quanto rende após X anos" **em dinheiro de hoje**, e não só em valor nominal.
2. Entregar os simuladores da Fase 2 que não dependem de dados novos de mercado: inflação, aposentadoria/independência financeira e financiamento.
3. Manter as regras do MVP:
   - funções puras e testadas em `src/lib/finance`;
   - nenhum dado inventado;
   - premissas visíveis e editáveis;
   - aviso padrão;
   - sem linguagem de promessa.

## 3. Não objetivos

- **Renda passiva e dividendos:** dependem de proventos reais por ativo. Ficam como `planned`.
- **Aporte mensal no comparador de renda fixa:** cada aporte tem o próprio prazo de IR e a própria carência de LCI/LCA, o que deixa a leitura confusa. O simulador de juros compostos já cobre aportes.
- **Fora dos modelos:**
  - IR sobre os rendimentos nos simuladores de aposentadoria/independência;
  - seguros (MIP/DFI), taxas administrativas, correção por TR, IOF e CET no financiamento.

  Cada tela diz isso explicitamente.

## 4. Antiobjetivos

- Nenhum número com cara de previsão. Inflação futura e rentabilidade esperada são sempre **premissas do usuário**, rotuladas como tal, com o valor padrão vindo de dado real e citado (IPCA 12 meses do BCB, com referência).
- Nada de "você vai se aposentar com", "garanta" ou "renda garantida".
- Correção monetária só com IPCA real do BCB. Se a fonte falhar, mostrar "Dado indisponível no momento" e não calcular.

## 5. Entregas

### 5.1 Inflação nos simuladores existentes

**Juros compostos (`/simuladores/juros-compostos`):**
- Campo novo "Inflação anual esperada (premissa)", com parâmetro de URL `inflacao`. A URL só grava `inflacao` quando o valor difere do padrão do servidor; campo vazio com padrão disponível grava `inflacao=` (desligado). Assim, um link sem edição usa o IPCA do dia em que é aberto (ruling R13).
- Padrão: IPCA acumulado em 12 meses (BCB, série 13522), arredondado a 2 casas. A nota descreve o padrão, e não o valor do campo: "Padrão: IPCA 12 meses de X% (ref. MM/aaaa); premissa, não previsão." (ruling R13). Se o BCB estiver indisponível, o campo fica vazio e a seção real não aparece até o usuário digitar um valor.
- Resultado: "Valor final em reais de hoje" = `saldo / (1 + inflação)^(meses/12)`, e a "taxa real" equivalente `(1 + i_nominal)/(1 + i_inflação) − 1`, mensal e anual.
- A tabela anual ganha a coluna "Em reais de hoje", com cada linha deflacionada pelo próprio prazo.
- Inflação vazia desliga a parte real. É permitido de −50% a 100% a.a.

**Comparador (`/ferramentas/comparador`):**
- Mesmo campo de inflação, com o mesmo padrão.
- Colunas novas:
  - "Líquido em reais de hoje" = `líquido / (1 + inflação)^(dias/365)`;
  - "Retorno real anualizado" = `(1 + retorno líquido anualizado)/(1 + inflação) − 1`.
- O destaque continua "maior valor líquido nesta simulação". O deflator é o mesmo em todas as linhas, então a ordem não muda.

Deflação pura em `src/lib/finance/inflation.ts`: `toPresentValue(value, annualInflation, years)` e `realRate(nominal, inflation)`.

### 5.2 Simulador de inflação (`/simuladores/inflacao`)

O registro `TOOLS` passa `inflacao` para `available`. A página tem duas abas, com o componente `Tabs` do design system.

**Aba "Corrigir um valor":**
- **Entradas:** valor (R$), mês inicial e mês final no formato MM/aaaa. O mínimo é **07/1994** (início do real); o máximo é o último mês publicado do IPCA (série 433).
- **Convenção:** o fator é o produto de `(1 + IPCA_m)` dos meses **após o mês inicial até o mês final, inclusive**. É a razão entre os números-índice do fim de cada mês. A tela explica isso em uma frase e não diz que replica a Calculadora do Cidadão do BCB.
- **Saída:**
  - valor corrigido;
  - inflação acumulada (%);
  - número de meses;
  - fonte "Banco Central do Brasil — SGS 433, consultado em …".
- Mês final anterior ao inicial é erro de validação. Meses iguais dão fator 1.
- **Dados:** histórico mensal do IPCA desde 07/1994, carregado no servidor e passado ao componente cliente (cerca de 390 números). Fonte indisponível: a aba mostra "Dado indisponível no momento" e não deixa calcular.

**Aba "Poder de compra no futuro":**
- **Entradas:** valor de hoje, anos (1 a 50) e inflação estimada (% a.a.; padrão IPCA 12 meses, rotulado como premissa).
- **Saídas:**
  - "Para comprar o mesmo daqui a N anos, serão necessários R$ X";
  - "R$ V de hoje comprarão o equivalente a R$ Y".

### 5.3 Aposentadoria e independência financeira (`/simuladores/independencia-financeira`)

Junta as entradas `aposentadoria` e `independencia-financeira` do `TOOLS` numa só ferramenta `available`. O título é "Aposentadoria e independência financeira" e as palavras-chave das duas entradas são mantidas.

**Modelo:**
- Tudo em **reais de hoje**, com taxa **real**.
- "Viver de rendimentos" significa sacar só o rendimento real, sem consumir o patrimônio (perpetuidade).

**Entradas:**
- idade atual (18 a 100);
- idade-alvo, opcional (maior que a idade atual e até 100);
- patrimônio atual (≥ 0);
- aporte mensal (≥ 0);
- renda mensal desejada (> 0);
- rentabilidade real esperada, em % a.a. acima da inflação, de 0 a 15%. Padrão **4%**, rotulado "premissa; não é previsão".

**Saídas:**
1. **Patrimônio necessário** = `renda / i_m`, com `i_m = (1 + real)^(1/12) − 1`. Se `real = 0`, a mensagem é "Com rentabilidade real zero, não é possível viver só dos rendimentos" e não há número.
2. **Tempo até o patrimônio necessário:** o menor `n`, em meses, em que `FV(patrimônio, aporte, i_m, n) ≥ necessário`, com aporte no fim do mês, como no simulador de juros compostos. Apresentado em anos e meses e na idade correspondente. Se não chegar em 100 anos, a mensagem é "Com esses valores, o patrimônio necessário não é atingido em 100 anos".
3. **Com idade-alvo:** o aporte mensal necessário para chegar lá, resolvido pela fórmula de PMT. Se o patrimônio atual já bastar hoje (tempo 0), mostrar "O patrimônio atual já cobre a renda desejada nesta simulação". Se ele só chegaria ao necessário com o tempo, sem novos aportes, mostrar "Sem novos aportes, o patrimônio atual chegaria ao necessário até os {alvo} anos nesta simulação." (ruling R12).
4. Gráfico da evolução do patrimônio (`StackedAreaChart`/`ChartFrame`, com uma linha de referência no patrimônio necessário) e tabela anual acessível. *Decisão do plano:* a linha de referência no gráfico foi trocada pelo patrimônio necessário citado no texto e na legenda da tabela.

**Avisos específicos:** rentabilidade real constante é uma simplificação; IR e custos não estão incluídos; resultados reais variam.

### 5.4 Financiamento SAC × Price (`/simuladores/financiamento`)

Junta `financiamento` e `amortizacao` do `TOOLS` numa só ferramenta `available`, com o título "Financiamento: SAC e Price".

**Entradas:**
- valor financiado (> 0);
- taxa de juros, em % a.m. ou % a.a. (a anual é convertida pela taxa equivalente);
- prazo de 1 a 420 meses;
- amortização extra mensal, opcional (≥ 0). Ela reduz o **prazo**, mantendo a regra de cada sistema sobre o saldo.

**Regras:**
- **Price:** `PMT = PV·i/(1 − (1+i)^−n)`. Com extra, a parcela fica fixa e o extra abate o saldo, encurtando o prazo.
- **SAC:** a amortização é constante, `PV/n`, e os juros incidem sobre o saldo. Com extra, a amortização constante se mantém e o extra é somado.
- A última parcela é ajustada para zerar o saldo, sem saldo negativo.
- Taxa zero é permitida: só amortização.

**Saídas, para cada sistema lado a lado:**
- primeira e última parcela;
- total pago;
- total de juros;
- número de parcelas;
- economia de juros e de meses com o extra, comparada ao mesmo sistema sem extra.

Gráfico da evolução da parcela por sistema e tabela anual acessível, com a mensal disponível num `<details>`.

**Sem destaque de "melhor".** A tela descreve a diferença: no SAC as parcelas começam maiores e caem, e os juros totais são menores; na Price as parcelas são fixas e os juros totais, maiores.

**Avisos:** seguros, taxas, TR, IOF e CET não estão incluídos; a parcela real do banco será diferente.

## 6. Dados

- Nova operação na camada de dados: `getIndicatorHistory(id: 'ipcaMonth', from: 'YYYY-MM')`, que devolve `DataResult<{ month: 'YYYY-MM'; value: number }[]>`. Ela é implementada no provedor BCB com consulta por período, dividida em blocos de até 10 anos por precaução, e com cache de 24 h.
- O IPCA 12 meses que serve de padrão vem do `getIndicator('ipca12m')`, que já existe.
- A UI continua sem chamar APIs externas.

## 7. Comum a todas as entregas

- Funções puras em `src/lib/finance` (`inflation.ts`, `retirement.ts`, `financing.ts`), em TDD, com valores de referência nos testes:
  - **Price:** PV 100.000, 1% a.m., 12 meses → PMT 8.884,88; juros totais 6.618,55.
  - **SAC:** PV 100.000, 1% a.m., 12 meses → primeira parcela 9.333,33, última 8.416,67, juros totais 6.500,00.
  - **Correção:** fator do produto confere com o cálculo manual de 3 meses de IPCA conhecido (fixture real gravada da série 433).
  - **Independência:** renda 5.000, real 4% a.a. → patrimônio necessário = `5000 / (1,04^(1/12) − 1)` ≈ 1.527.305,26 (o teste usa a fórmula exata).
- Validação com Zod e estado na URL para compartilhar, como no simulador de juros compostos.
- Formatação por `src/lib/format`.
- Aviso padrão em destaque, `buildMetadata`, sitemap, busca (via `TOOLS`) e o card na listagem `/simuladores`.
- E2E: cada página nova abre, calcula com a entrada padrão e passa no axe (desktop e celular). O simulador de inflação tem um teste com o BCB inacessível, que mostra "Dado indisponível no momento".
- Documentação: README, ROADMAP (Fase 2A) e ARCHITECTURE (ADR para a convenção do IPCA e para a perpetuidade real).

## 8. Fica a critério de quem implementa

Layout interno de cada formulário, dentro do design system e do padrão visual dos dois simuladores existentes; textos curtos de ajuda; nomes de componentes internos.
