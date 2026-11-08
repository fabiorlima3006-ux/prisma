export type Plan = 'free' | 'premium' | 'pro';

export type Feature = { label: string; minPlan: Plan };

/**
 * Registro de funcionalidades por plano mínimo (preparação para a Fase 4).
 * No MVP não há contas nem cobrança: `canAccess` libera tudo.
 */
export const FEATURES: Record<string, Feature> = {
  news: { label: 'Notícias', minPlan: 'free' },
  education: { label: 'Conteúdo educativo', minPlan: 'free' },
  indicators: { label: 'Indicadores de mercado', minPlan: 'free' },
  basicSimulators: { label: 'Simuladores básicos', minPlan: 'free' },
  advancedAnalysis: { label: 'Análises avançadas', minPlan: 'premium' },
  portfolio: { label: 'Carteira', minPlan: 'premium' },
  alerts: { label: 'Alertas', minPlan: 'premium' },
  screener: { label: 'Screener', minPlan: 'premium' },
  options: { label: 'Análise de opções', minPlan: 'premium' },
  reports: { label: 'Relatórios', minPlan: 'premium' },
  publicApi: { label: 'API pública com chave', minPlan: 'pro' },
  analystTools: { label: 'Recursos para analistas', minPlan: 'pro' },
};

/** MVP: sempre `true`. Na Fase 4, comparará `user.plan` com `minPlan`. */
export function canAccess(feature: keyof typeof FEATURES, user?: { plan: Plan }): boolean {
  void feature;
  void user;
  return true;
}
