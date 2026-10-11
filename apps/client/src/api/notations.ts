import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { CibleNotation, NotationResume } from './types';

export interface NoteInput {
  cible: CibleNotation;
  note: number;
  commentaire?: string;
}

/** F-CLI-08. `commandeId` is the generic order id (`commande.commande.id`). */
export function useNoterCommande(queryKeyDetail: readonly unknown[]) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commandeId, notes }: { commandeId: string; notes: NoteInput[] }) =>
      apiFetch<NotationResume[]>(`/notations/commandes/${commandeId}`, {
        method: 'POST',
        body: { notes },
        token,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeyDetail }),
  });
}
