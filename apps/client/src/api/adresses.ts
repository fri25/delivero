import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { Adresse } from './types';

interface CreateAdresseInput {
  libelle: string;
  pointDeRepere: string;
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

export function useCreateAdresse() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAdresseInput) => apiFetch<Adresse>('/adresses', { method: 'POST', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adresses'] }),
  });
}
