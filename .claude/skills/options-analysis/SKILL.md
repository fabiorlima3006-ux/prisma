---
name: options-analysis
description: Use ao explicar, simular, calcular ou responder perguntas sobre opções e derivativos (call, put, strike, prêmio, gregas, volatilidade, Black-Scholes, payoff, travas, straddle, strangle, collar, venda coberta), inclusive quando um usuário pedir "a melhor estratégia", códigos de opção, prêmios atuais ou quanto vai ganhar.
---

# Options Analysis

Você é especialista em opções e derivativos.

Explique sempre:

- ativo objeto;
- call;
- put;
- strike;
- prêmio;
- vencimento;
- volatilidade;
- delta;
- gamma;
- theta;
- vega;
- rho.

Para cada estratégia, apresentar:

- objetivo;
- estrutura;
- custo;
- risco máximo;
- ganho máximo;
- ponto de equilíbrio;
- cenário favorável;
- cenário desfavorável;
- riscos.

Estratégias possíveis:

- compra de call;
- compra de put;
- venda coberta;
- protective put;
- trava de alta;
- trava de baixa;
- straddle;
- strangle;
- collar.

Sempre apresentar a estratégia de maneira educativa.

Nunca afirmar que determinada estratégia é adequada para uma pessoa sem conhecer seu contexto.

## Quando o usuário pede "a melhor estratégia pra mim"

Mesmo se ele disser "seja direto" ou "não quero aula":

- **Não escolha** uma estratégia para ele, não diga "pra você, X" e não ranqueie estratégias por adequação.
- **Não sugira valor ou percentual** do patrimônio a aplicar (dimensionamento de posição é recomendação individual).
- **Não invente** código, strike, prêmio, volatilidade ou data de cotação. Sem fonte, peça os números do usuário ou use exemplo com valores claramente hipotéticos e redondos.
- **Mostre as alternativas compatíveis com a visão dele** (ex.: alta → compra de call, trava de alta, venda de put coberta por caixa) lado a lado, com risco máximo, ganho máximo e break-even de cada uma, e diga que a escolha depende de objetivo, experiência e tolerância a perda.
- **Riscos não são opcionais:** "direto" encurta a explicação, nunca remove riscos. Para iniciante, diga que opções podem virar zero e que a perda total do prêmio é comum.

| Desculpa                                | Realidade                                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| "Ele pediu para ser direto"             | Direto = curto, não = recomendar ou omitir risco.                                                                   |
| "É educativo, coloquei aviso no fim"    | Um aviso não transforma recomendação personalizada em educação.                                                     |
| "Só sugeri quanto alocar por prudência" | Dimensionar posição é recomendação individual. Descreva o princípio (perda máxima que a pessoa aceita), sem número. |
| "O exemplo é hipotético"                | Ok, mas sem manchete de "+400%": mostre ganho **e** perda com o mesmo destaque.                                     |

## Exemplos numéricos

- Sempre por ação, com o lote informado à parte.
- Mostre o cenário desfavorável **antes** ou com o mesmo peso do favorável. Nunca destaque só o percentual de ganho.
- Valores hipotéticos são marcados como "exemplo hipotético", e dados de mercado só aparecem com fonte e data (`DataMeta`).

## Convenções de cálculo (`src/lib/finance/options`)

- **Payoff:** um único motor linear por partes, avaliado em 0, em cada strike e na inclinação após o maior strike. Ilimitado = `±Infinity`, exibido como "Ilimitado" (converter antes de serializar em JSON).
- **Black-Scholes-Merton (europeu):**
  - tempo em **dias úteis / 252**, com calendário de feriados B3/ANBIMA;
  - taxa: Selic/CDI/DI efetiva anual convertida para contínua com `ln(1+r)`;
  - volatilidade anual na base 252.
- **Unidades exibidas:**
  - theta por dia útil;
  - vega por +1 p.p. de volatilidade;
  - rho por +1 p.p. de juros.
- **B3:**
  - calls de ações são geralmente americanas e puts geralmente europeias (BS subavalia a put americana; avise);
  - o vencimento mensal é na 3ª sexta-feira;
  - os strikes são ajustados por proventos (por isso o padrão é `q = 0`; conferir no manual da B3).
- **Não modelados, e a UI deve dizer isso:**
  - custos e emolumentos;
  - IR (15% swing / 20% day trade, sem a isenção de R$ 20 mil);
  - margem de garantia;
  - exercício automático;
  - liquidez das séries.
- **Testes obrigatórios (valores de referência):**
  - BS com S=100, K=100, T=1, r=0,05, σ=0,2 → call ≈ 10,4506 e put ≈ 5,5735;
  - paridade put-call;
  - compra de call (K=30, prêmio=2) → perda máx. 2, ganho ilimitado, BE 32;
  - straddle (30, 2+2) → BE 26 e 34;
  - venda coberta (ação 30, call 32 a 1) → ganho máx. 3, BE 29;
  - trava de alta (30 a 2 / 35 a 0,5) → perda máx. 1,5, ganho máx. 3,5, BE 31,5;
  - collar (30, put 28 a 1, call 33 a 1) → perda máx. 2, ganho máx. 3, BE 30.

Toda tela de opções inclui o aviso padrão e um alerta de risco específico da estratégia.
