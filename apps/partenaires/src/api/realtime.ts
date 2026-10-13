import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { jouerAlerte } from '../lib/alarme';
import { REALTIME_URL, type CommandeNouvellePayload } from '../lib/realtime';
import { useAuthStore } from '../stores/auth-store';

// Monté une fois dans RootLayout : alerte immédiate à la réception d'une
// nouvelle commande (F-RES-01), en plus du polling existant. L'alarme
// répétée tant qu'une commande attend est gérée par useAlarmeCommandes.
export function useRealtimeNouvellesCommandes() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      return;
    }

    // Loaded on demand: the sign-in screen does not pay for socket.io.
    let socket: Socket | null = null;
    let annule = false;
    void import('socket.io-client').then(({ io }) => {
      if (annule) return;
      socket = io(REALTIME_URL, { auth: { token }, transports: ['websocket'] });

      socket.on('commande:nouvelle', (_payload: CommandeNouvellePayload) => {
        jouerAlerte();
        toast.info('Nouvelle commande reçue.');
        void queryClient.invalidateQueries({ queryKey: ['restaurant-commandes'] });
      });

      socket.on('commande:statut', (_payload: CommandeNouvellePayload) => {
        void queryClient.invalidateQueries({ queryKey: ['restaurant-commandes'] });
      });
    });

    return () => {
      annule = true;
      socket?.disconnect();
    };
  }, [token, queryClient]);
}
