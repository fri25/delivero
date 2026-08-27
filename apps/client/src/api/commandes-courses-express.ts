import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import { TERMINAL_STATUTS_COURSES_EXPRESS } from '../lib/statut-courses-express';
import type { CommandeCoursesExpress, ModePaiement } from './types';

interface CreateEtapeInput {
  description: string;
  pointDeRepere: string;
  adresse?: string;
}

interface CreateCommandeCoursesExpressInput {
  description: string;
  zoneId: string;
  modePaiement: ModePaiement;
  etapes: CreateEtapeInput[];
}

interface EstimationCoursesExpress {
  zoneId: string;
  nombreEtapes: number;
  tarif: number;
}

export function useEstimationCoursesExpress(
  zoneId: string | undefined,
  nombreEtapes: number | undefined,
) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['estimation-courses-express', zoneId, nombreEtapes],
    queryFn: () =>
      apiFetch<EstimationCoursesExpress>(
        `/commandes/courses-express/estimation?zoneId=${encodeURIComponent(zoneId!)}&nombreEtapes=${nombreEtapes}`,
        { token },
      ),
    enabled: Boolean(zoneId && nombreEtapes && nombreEtapes > 0 && token),
  });
}

export function useCreateCommandeCoursesExpress() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCommandeCoursesExpressInput) =>
      apiFetch<CommandeCoursesExpress>('/commandes/courses-express', {
        method: 'POST',
        body: dto,
        token,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mes-commandes-courses-express'] }),
  });
}

export function useCommandeCoursesExpress(id: string | undefined) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['commande-courses-express', id],
    queryFn: () => apiFetch<CommandeCoursesExpress>(`/commandes/courses-express/${id}`, { token }),
    enabled: Boolean(id && token),
    refetchInterval: (query) => {
      const statut = query.state.data?.statut;
      return statut && TERMINAL_STATUTS_COURSES_EXPRESS.includes(statut) ? false : 5000;
    },
  });
}

export function useMesCommandesCoursesExpress() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mes-commandes-courses-express'],
    queryFn: () =>
      apiFetch<CommandeCoursesExpress[]>('/commandes/courses-express/mes-commandes', { token }),
    enabled: Boolean(token),
  });
}

export function useAnnulerCommandeCoursesExpress() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeCoursesExpress>(`/commandes/courses-express/${id}/annuler`, {
        method: 'PATCH',
        token,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mes-commandes-courses-express'] });
      queryClient.setQueryData(['commande-courses-express', data.id], data);
    },
  });
}
