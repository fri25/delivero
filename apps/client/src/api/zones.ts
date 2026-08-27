import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { Zone } from './types';

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: () => apiFetch<Zone[]>('/zones'),
  });
}
