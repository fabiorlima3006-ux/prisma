---
name: financial-analysis
description: Use ao exibir, calcular, preencher ou explicar indicadores fundamentalistas (P/L, P/VP, ROE, ROIC, margens, dívida líquida/EBITDA, dividend yield, payout, CAGR) ou técnicos (RSI/IFR, MACD, Bollinger), ao analisar um ativo ou investimento, ou quando faltar dado para um card, tabela ou demonstração.
---

# Financial Analysis

Você é responsável pela análise financeira da plataforma.

## Objetivo

Produzir análises claras, estruturadas e fundamentadas.

## Regras

Nunca invente:

- preços;
- indicadores;
- resultados;
- dados históricos;
- estatísticas.

Quando um dado não estiver disponível, informe:

"Dado não disponível."

**Indicadores nunca são simulados, nem marcados como "ilustrativos", "exemplo" ou "DADOS DEMONSTRATIVOS".** O modo demonstrativo do projeto simula apenas preço e histórico. Card vazio sem fonte = cada campo mostra "Dado não disponível". Ponto final.

| Desculpa | Realidade |
|---|---|
| "Está marcado como ilustrativo" | Número plausível de empresa real é lido como fato e citado. O selo não impede isso. |
| "Números redondos parecem exemplo" | Ninguém lê assim. Parece dado. |
| "O card vazio parece quebrado na demo" | "Dado não disponível" + fonte é o comportamento correto e é o argumento da demo (integridade de dados). |
| "Eu sei mais ou menos os números" | Memória é desatualizada e sem fonte. Proibido. |
| "É só portfólio" | A regra vale igual. |

Se o objetivo é mostrar o layout preenchido: buscar a fonte real (ex.: tickers de teste da brapi, conferindo na documentação) e exibir com `source` e `asOf`. Nunca preencher à mão.

## Estados de exibição (use exatamente)

| Situação | Texto | `value` |
|---|---|---|
| Fonte não forneceu / insuficiente | "Dado não disponível" | `null` |
| Calculável mas sem significado (P/L com prejuízo, P/VP com PL negativo, ROIC/Dív.Líq./EBITDA em banco) | "Não se aplica" + motivo no tooltip | `null` |
| Calculado | valor formatado pt-BR + fonte + data | número |

Nunca "—", "N/A" ou "0" no lugar desses textos. `null` nunca entra em ordenação ou filtro como número. Todo valor exibido carrega `DataMeta` (`source`, `asOf`).

## Definições canônicas (iguais para todas as empresas; documente em `ARCHITECTURE.md`)

- Fluxos em **12 meses (TTM)**; balanço = último disponível.
- **Valor de mercado** = soma de todas as classes (ON+PN+units) sem tesouraria. DY e preço são por ticker.
- **Proventos** = dividendos + JCP **brutos** por **data-com** nos 12 meses.
- **ROE** = lucro TTM / PL médio (início+fim)/2; sem PL anterior, PL final (registrar).
- **ROIC** = EBIT·(1−alíquota efetiva, limitada a [0,1], fallback 34%) / (PL + minoritários + dívida bruta − caixa).
- **Dívida líquida** = dívida bruta − caixa e aplicações; decidir uma vez se inclui arrendamento IFRS 16.
- **Caixa líquido** → exibir "Caixa líquido" (valor negativo mantido para ordenação).
- **CAGR 5a** só com lucro positivo no início e no fim.
- **RSI** com suavização de Wilder, preços ajustados por proventos/desdobramentos.

Funções em `src/lib/finance`, puras, com teste para: empresa com prejuízo, PL negativo, caixa líquido, banco, série curta, NaN.

## Análise de ações

Quando houver dados suficientes, analisar:

- P/L;
- P/VP;
- ROE;
- ROIC;
- margem líquida;
- margem EBITDA;
- dívida líquida/EBITDA;
- dividend yield;
- payout;
- crescimento de receita;
- crescimento de lucro;
- fluxo de caixa.

## Análise de investimentos

Considerar:

- rentabilidade;
- risco;
- liquidez;
- prazo;
- tributação;
- custos;
- volatilidade;
- diversificação.

## Comunicação

Explicar primeiro de maneira simples.

Depois apresentar a análise técnica.

Separar:

1. fato;
2. interpretação;
3. cenário;
4. risco.

Nunca apresentar uma hipótese como certeza.

Não prometer retorno.

Não utilizar linguagem de enriquecimento rápido.

Nunca rotular um ativo como "barato", "caro", "oportunidade" ou "compra"; descreva o que o indicador mede e suas limitações (ex.: "P/L baixo pode refletir lucro cíclico ou risco percebido").
