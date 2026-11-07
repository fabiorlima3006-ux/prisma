// Colunas qualitativas do comparador. Texto descritivo; não cita limites numéricos do FGC
// por não terem sido verificados em fonte oficial nesta tarefa.
export type ProductId = 'savings' | 'cdb' | 'tesouro-selic' | 'lci' | 'lca';

export const PRODUCT_META: Record<
  ProductId,
  { label: string; liquidity: string; risk: string; fgc: string; source: string }
> = {
  savings: {
    label: 'Poupança',
    liquidity: 'Resgate a qualquer momento; o rendimento é creditado a cada aniversário mensal.',
    risk: 'Risco do banco emissor, com cobertura do FGC dentro dos limites vigentes.',
    fgc: 'Coberta pelo FGC dentro dos limites vigentes.',
    source: 'https://www.fgc.org.br',
  },
  cdb: {
    label: 'CDB',
    liquidity: 'Depende do título: pode ter liquidez diária ou apenas no vencimento.',
    risk: 'Risco de crédito do banco emissor.',
    fgc: 'Coberto pelo FGC dentro dos limites vigentes.',
    source: 'https://www.fgc.org.br',
  },
  'tesouro-selic': {
    label: 'Tesouro Selic',
    liquidity: 'Resgate em dia útil, com liquidação no dia seguinte (D+1).',
    risk: 'Título público federal; risco de crédito do Tesouro Nacional.',
    fgc: 'Não é coberto pelo FGC; tem garantia do Tesouro Nacional.',
    source: 'https://www.tesourodireto.com.br',
  },
  lci: {
    label: 'LCI',
    liquidity: 'Prazo mínimo (carência) conforme a regulamentação; depende do título.',
    risk: 'Risco de crédito do banco emissor.',
    fgc: 'Coberta pelo FGC dentro dos limites vigentes.',
    source: 'https://www.fgc.org.br',
  },
  lca: {
    label: 'LCA',
    liquidity: 'Prazo mínimo (carência) conforme a regulamentação; depende do título.',
    risk: 'Risco de crédito do banco emissor.',
    fgc: 'Coberta pelo FGC dentro dos limites vigentes.',
    source: 'https://www.fgc.org.br',
  },
};
