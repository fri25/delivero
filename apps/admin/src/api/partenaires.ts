import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { PartenaireAdmin } from './types';

// F-ADM-08 — restaurants and their sign-in accounts.

export interface CreatePartenaireInput {
  nom: string;
  telephone: string;
  motDePasse: string;
  zoneId: string;
  pointDeRepere: string;
  adresse?: string;
  description?: string;
}

export interface UpdatePartenaireInput {
  nom?: string;
  zoneId?: string;
  pointDeRepere?: string;
  adresse?: string;
  motDePasse?: string;
}

export function usePartenaires() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['admin-partenaires'],
    queryFn: () => apiFetch<PartenaireAdmin[]>('/admin/partenaires', { token }),
    enabled: Boolean(token),
  });
}

function useMutationPartenaire<T>(requete: (input: T, token: string | null) => Promise<PartenaireAdmin>) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: T) => requete(input, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-partenaires'] }),
  });
}

export function useCreatePartenaire() {
  return useMutationPartenaire((dto: CreatePartenaireInput, token) =>
    apiFetch<PartenaireAdmin>('/admin/partenaires', { method: 'POST', body: dto, token }),
  );
}

export function useUpdatePartenaire() {
  return useMutationPartenaire(({ id, dto }: { id: string; dto: UpdatePartenaireInput }, token) =>
    apiFetch<PartenaireAdmin>(`/admin/partenaires/${id}`, { method: 'PATCH', body: dto, token }),
  );
}

export function useSuspendrePartenaire() {
  return useMutationPartenaire(({ id, suspendu }: { id: string; suspendu: boolean }, token) =>
    apiFetch<PartenaireAdmin>(`/admin/partenaires/${id}/suspension`, { method: 'PATCH', body: { suspendu }, token }),
  );
}
