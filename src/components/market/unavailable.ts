import type { UnavailableReason } from '@/lib/data/types';

export const UNAVAILABLE_TEXT = 'Dado não disponível';
const FAILED_TEXT = 'Dado indisponível no momento';

export function unavailableText(reason: UnavailableReason): string {
  return reason === 'not-provided' ? UNAVAILABLE_TEXT : FAILED_TEXT;
}
