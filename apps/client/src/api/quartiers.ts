import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { Quartier } from './types';

/**
 * Priced neighbourhoods (Q-28, decided 13/10): they set the Repas delivery
 * fee and the Colis / Courses express prices. Public (guests pick one too)
 * and rarely changed: cached for the session.
 */
export function useQuartiers() {
  return useQuery({
    queryKey: ['quartiers'],
    queryFn: () => apiFetch<Quartier[]>('/quartiers'),
    staleTime: 60 * 60 * 1000,
  });
}
