import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { REALTIME_URL, jouerAlerteSonore, type CommandeNouvellePayload } from '../lib/realtime';
import { useAuthStore } from '../stores/auth-store';

// Monté une fois dans RootLayout : alerte immédiate à la réception d'une
// nouvelle commande (F-RES-01), en plus du polling existant.
export function useRealtimeNouvellesCommandes() {
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

    socket.on('commande:nouvelle', (_payload: CommandeNouvellePayload) => {
      jouerAlerteSonore();
      toast.info('Nouvelle commande reçue.');
      queryClient.invalidateQueries({ queryKey: ['restaurant-commandes'] });
    });

    socket.on('commande:statut', (_payload: CommandeNouvellePayload) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-commandes'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);
}
