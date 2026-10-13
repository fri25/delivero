// F-RES-01 : réception temps réel. Le polling reste en filet de secours
// (POLL_INTERVAL_MS dans api/commandes.ts). Voir
// apps/api/src/realtime/realtime.gateway.ts pour le serveur ; le son est
// géré par lib/alarme.ts.
export const REALTIME_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(
  /\/api\/?$/,
  '',
);

export interface CommandeNouvellePayload {
  typeService: string;
  commandeId: string;
}
