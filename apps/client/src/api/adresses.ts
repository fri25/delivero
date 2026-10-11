import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { Adresse } from './types';

export interface AdresseInput {
  libelle: string;
  pointDeRepere: string;
  /** null clears a previously saved GPS position. */
  latitude?: number | null;
  longitude?: number | null;
  estParDefaut?: boolean;
}

export function useAdresses() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['adresses'],
    queryFn: () => apiFetch<Adresse[]>('/adresses', { token }),
    enabled: Boolean(token),
  });
}

function useAdresseMutation<TVariables>(request: (token: string | null, variables: TVariables) => Promise<Adresse | void>) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => request(token, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adresses'] }),
  });
}

export function useCreateAdresse() {
  return useAdresseMutation((token, dto: AdresseInput) =>
    apiFetch<Adresse>('/adresses', { method: 'POST', body: dto, token }),
  );
}

export function useUpdateAdresse() {
  return useAdresseMutation((token, { id, ...dto }: AdresseInput & { id: string }) =>
    apiFetch<Adresse>(`/adresses/${id}`, { method: 'PATCH', body: dto, token }),
  );
}

export function useDefinirAdresseParDefaut() {
  return useAdresseMutation((token, id: string) =>
    apiFetch<Adresse>(`/adresses/${id}/defaut`, { method: 'PATCH', token }),
  );
}

export function useSupprimerAdresse() {
  return useAdresseMutation((token, id: string) =>
    apiFetch<void>(`/adresses/${id}`, { method: 'DELETE', token }),
  );
}
