/** Riscos genéricos da CLASSE de ativo, de caráter educativo. Nunca sobre uma empresa específica. */
export const RISK_TEXTS: Record<'stock' | 'fii' | 'etf' | 'crypto', string[]> = {
  stock: [
    'Volatilidade: os preços das ações oscilam com resultados, juros, câmbio e humor do mercado, e perdas no valor investido são possíveis.',
    'Liquidez: papéis com poucos negócios diários podem ser difíceis de negociar no preço e no momento desejados.',
    'Concentração: manter poucos ativos ou um único setor aumenta a dependência de um mesmo tipo de evento.',
    'Risco de negócio: lucros e dividendos dependem do desempenho da empresa e não são fixos.',
  ],
  fii: [
    'Vacância e inadimplência: imóveis desocupados ou inquilinos que deixam de pagar reduzem a renda distribuída.',
    'Risco de crédito: fundos de papel dependem da capacidade de pagamento dos devedores dos títulos que carregam.',
    'Liquidez: as cotas negociam em bolsa e podem ter poucos negócios, com preço diferente do valor patrimonial.',
    'Juros e tributação: variações na taxa de juros afetam preços, e regras de isenção de rendimentos têm condições específicas.',
    'Concentração: fundos com poucos imóveis ou poucos devedores têm resultado mais sensível a um único evento.',
  ],
  etf: [
    'Volatilidade: o ETF acompanha seu índice e oscila junto com ele, inclusive em quedas prolongadas.',
    'Erro de acompanhamento: o retorno do fundo pode diferir do índice por custos e pela forma de replicação.',
    'Câmbio: ETFs que replicam índices do exterior sofrem a variação da moeda, além da variação dos ativos.',
    'Liquidez: alguns ETFs têm pouco volume, o que pode encarecer o custo de entrar e sair da posição.',
    'Concentração: índices podem ser dominados por poucas empresas ou setores.',
  ],
  crypto: [
    'Volatilidade extrema: variações diárias e mensais muito maiores do que as de ativos tradicionais são comuns.',
    'Custódia: perder o acesso às chaves privadas ou usar uma plataforma que sofra falha ou ataque pode significar perda total.',
    'Regulação: regras sobre o tema ainda estão em evolução e podem mudar o cenário de forma abrupta.',
    'Liquidez e mercado 24 horas: o preço se move a qualquer hora e pode variar entre plataformas.',
    'Sem fluxo de caixa: diferentemente de empresas ou imóveis, não há lucro ou aluguel que sustente o preço.',
  ],
};
