import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import {
  COMMANDE_QUERY_KEYS,
  REALTIME_URL,
  type CommandeStatutPayload,
} from '../lib/realtime';
import { useAuthStore } from '../stores/auth-store';

// Monté une fois dans RootLayout : écoute les mises à jour de statut sur les
// 4 services et rafraîchit les requêtes React Query concernées, pour que le
// client n'attende pas le prochain polling (jusqu'à 5s, voir
// api/commandes-repas.ts).
export function useRealtimeCommandeUpdates() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket: Socket = io(REALTIME_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('commande:statut', (payload: CommandeStatutPayload) => {
      const keys = COMMANDE_QUERY_KEYS[payload.typeService];
      if (!keys) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: [keys.detail, payload.commandeId] });
      queryClient.invalidateQueries({ queryKey: [keys.liste] });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);
}
