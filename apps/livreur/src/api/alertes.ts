import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { SERVICE_LABELS, type ServiceLivreur } from '@/lib/taches';
import { useAuthStore } from '@/stores/auth-store';

// Same server as the REST API, without the /api prefix
// (apps/api/src/realtime/realtime.gateway.ts).
const REALTIME_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/api\/?$/, '');

const DISPONIBLES = ['courses-disponibles', 'colis-disponibles', 'courses-express-disponibles', 'emplettes-disponibles'];
const MIENNES = ['mes-courses', 'mes-colis', 'mes-courses-express', 'mes-emplettes'];

/** A short buzz on phones that support it: the livreur may not be looking. */
function vibrer() {
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    // Not supported: the toast is enough.
  }
}

/**
 * Mounted once in RootLayout. Listens to the livreur events of the API
 * (AlertesLivreursService): refreshes the lists at once instead of waiting
 * for the next poll, and tells the livreur with a toast + vibration. The
 * polling stays as a safety net (reconnections, unstable 3G).
 */
export function useAlertesLivreur() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    // Loaded on demand: the sign-in screen does not pay for socket.io.
    let socket: Socket | null = null;
    let annule = false;
    void import('socket.io-client').then(({ io }) => {
      if (annule) return;
      socket = io(REALTIME_URL, { auth: { token }, transports: ['websocket'] });

      socket.on('livreur:course-disponible', (payload: { typeService: ServiceLivreur }) => {
        for (const cle of DISPONIBLES) void queryClient.invalidateQueries({ queryKey: [cle] });
        vibrer();
        toast.info(`Nouvelle course : ${SERVICE_LABELS[payload.typeService] ?? 'course'}`, {
          action: { label: 'Voir', onClick: () => navigate('/') },
        });
      });

      socket.on('livreur:course-attribuee', () => {
        // Assigned: it leaves "À prendre" and joins "En cours".
        for (const cle of [...MIENNES, ...DISPONIBLES]) void queryClient.invalidateQueries({ queryKey: [cle] });
        vibrer();
        toast.success('Le dispatch vous a attribué une course.', {
          action: { label: 'Voir', onClick: () => navigate('/en-cours') },
          duration: 10_000,
        });
      });
    });

    return () => {
      annule = true;
      socket?.disconnect();
    };
  }, [token, queryClient, navigate]);
}
