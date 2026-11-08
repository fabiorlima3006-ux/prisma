import { describe, expect, it } from 'vitest';
import { FEATURES, canAccess } from './features';

describe('features', () => {
  it('no MVP, toda funcionalidade é acessível a qualquer usuário', () => {
    expect(Object.keys(FEATURES).every((f) => canAccess(f))).toBe(true);
  });

  it('acessível mesmo sem usuário ou com plano gratuito', () => {
    expect(canAccess('portfolio')).toBe(true);
    expect(canAccess('portfolio', { plan: 'free' })).toBe(true);
  });

  it('cada funcionalidade declara rótulo e plano mínimo válido', () => {
    for (const f of Object.values(FEATURES)) {
      expect(f.label.length).toBeGreaterThan(0);
      expect(['free', 'premium', 'pro']).toContain(f.minPlan);
    }
  });

  it('cobre os três planos', () => {
    const plans = new Set(Object.values(FEATURES).map((f) => f.minPlan));
    expect(plans).toEqual(new Set(['free', 'premium', 'pro']));
  });
});
