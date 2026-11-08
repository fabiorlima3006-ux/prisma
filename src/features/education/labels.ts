import type { BadgeTone } from '@/components/ui';
import type { TrackSlug } from './tracks';

export const LEVEL_TONE: Record<TrackSlug, BadgeTone> = {
  iniciante: 'beginner',
  intermediario: 'intermediate',
  avancado: 'advanced',
};

export const LEVEL_LABEL: Record<TrackSlug, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export function articlesLabel(n: number): string {
  return `${n} ${n === 1 ? 'artigo' : 'artigos'}`;
}
