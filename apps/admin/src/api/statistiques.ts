import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { Periode, Statistiques } from './types';

/** F-ADM-14 dashboard; refreshed every minute while the tab is open. */
export function useStatistiques(periode: Periode) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['admin-statistiques', periode],
    queryFn: () => apiFetch<Statistiques>('/admin/statistiques', { token, query: { periode } }),
    enabled: Boolean(token),
    refetchInterval: 60_000,
    placeholderData: (precedent) => precedent,
  });
}
