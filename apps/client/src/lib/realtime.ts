// F-CLI-05 : le suivi de commande reste par polling en filet de secours
// (refetchInterval dans api/commandes-*.ts) — ce module ajoute un
// rafraîchissement immédiat par WebSocket quand la connexion est disponible.
// Voir apps/api/src/realtime/realtime.gateway.ts pour le serveur.
export const REALTIME_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(
  /\/api\/?$/,
  '',
);

export const COMMANDE_QUERY_KEYS = {
  repas: { detail: 'commande-repas', liste: 'mes-commandes' },
  colis: { detail: 'commande-colis', liste: 'mes-commandes-colis' },
  emplettes: { detail: 'commande-emplettes', liste: 'mes-commandes-emplettes' },
  courses_express: {
    detail: 'commande-courses-express',
    liste: 'mes-commandes-courses-express',
  },
} as const;

export type TypeServiceRealtime = keyof typeof COMMANDE_QUERY_KEYS;

export interface CommandeStatutPayload {
  typeService: TypeServiceRealtime;
  commandeId: string;
  statut: string;
}
