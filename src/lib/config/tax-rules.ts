// Regras tributárias com fonte oficial. `verifiedAt: null` = não confirmada em fonte oficial.
export type Sourced = {
  effectiveFrom: string;
  source: string;
  verifiedAt: string | null;
};

export type TaxRules = {
  incomeTaxBrackets: Sourced & { brackets: { upToDays: number | null; rate: number }[] };
  lciLca: Sourced & {
    pfExempt: boolean;
    minHoldingDays: { lci: number; lca: number };
    verification: {
      lci: { source: string; verifiedAt: string | null };
      lca: { source: string; verifiedAt: string | null };
    };
  };
  tesouroCustody: Sourced & { annualRate: number; selicExemptUpTo: number };
  savings: Sourced & { selicThreshold: number; fixedMonthly: number; selicShare: number };
};

export const TAX_RULES: TaxRules = {
  // Lei 11.033/2004, art. 1º (base legal da IN RFB 1.585/2015, art. 46).
  incomeTaxBrackets: {
    effectiveFrom: '2005-01-01',
    source: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm',
    verifiedAt: '2026-11-07',
    brackets: [
      { upToDays: 180, rate: 0.225 },
      { upToDays: 360, rate: 0.2 },
      { upToDays: 720, rate: 0.175 },
      { upToDays: null, rate: 0.15 },
    ],
  },
  // Isenção: Lei 11.033/2004, art. 3º, II e IV.
  // Prazo mínimo de 180 dias (6 meses): vale SÓ para LCI/LCA SEM atualização por índice de preços
  // (pós-fixadas em % do CDI). Títulos indexados a preços têm mínimos maiores (LCI 36 meses se
  // atualizada mensalmente; LCA 12 meses se anual). O comparador simula apenas títulos em % do CDI,
  // então LCI/LCA indexadas a preços estão fora de escopo.
  // O `verifiedAt` de topo só é preenchido se LCI e LCA estiverem ambos verificados.
  lciLca: {
    effectiveFrom: '2025-05-23',
    source: 'https://normativos.bcb.gov.br/Lists/Normativos/Attachments/48547/Res_4410_v7_P.pdf',
    verifiedAt: '2026-11-07',
    pfExempt: true,
    minHoldingDays: { lci: 180, lca: 180 },
    verification: {
      lci: {
        // Res. CMN 4.410/2015, art. 4º, II, redação da Res. CMN 5.215/2025: "seis meses, nos demais casos".
        source: 'https://normativos.bcb.gov.br/Lists/Normativos/Attachments/48547/Res_4410_v7_P.pdf',
        verifiedAt: '2026-11-07',
      },
      lca: {
        // B3, Comunicado 016/2025-VPC (23/05/2025): LCI e LCA não atreladas a índice de preços,
        // prazo mínimo de 6 meses, conforme Res. CMN 5.215/2025.
        source:
          'https://www.b3.com.br/data/files/63/43/8C/0B/43FF69106B8BCB69AC094EA8/CE%20016-2025-VPC%20PLATAFORMA%20NOME%20BALCAO%20B3_LCA_LCI.pdf',
        verifiedAt: '2026-11-07',
      },
    },
  },
  tesouroCustody: {
    effectiveFrom: '2022-01-01',
    source: 'https://www.tesourodireto.com.br/en/b/entenda-a-nova-taxa-de-custodia',
    verifiedAt: '2026-11-07',
    annualRate: 0.002,
    selicExemptUpTo: 10000,
  },
  // Lei 12.703/2012, art. 1º (nova redação do art. 12 da Lei 8.177/1991).
  savings: {
    effectiveFrom: '2012-08-08',
    source: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12703.htm',
    verifiedAt: '2026-11-07',
    selicThreshold: 0.085,
    fixedMonthly: 0.005,
    selicShare: 0.7,
  },
};
