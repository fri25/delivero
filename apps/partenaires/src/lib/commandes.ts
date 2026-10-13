import type { CommandeRepas, StatutRepas } from '@/api/types';

export const STATUT_LABELS: Record<StatutRepas, string> = {
  en_attente_acceptation: 'À accepter',
  confirmee: 'Acceptée',
  refusee: 'Refusée',
  en_preparation: 'En préparation',
  prete: 'Prête',
  recuperee_par_livreur: 'Partie avec le livreur',
  en_route: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
};

/** Kitchen board columns, in the order the restaurant works through them. */
export type Etape = 'a_accepter' | 'en_cuisine' | 'pretes' | 'parties' | 'terminees';

const ETAPE_PAR_STATUT: Record<StatutRepas, Etape> = {
  en_attente_acceptation: 'a_accepter',
  confirmee: 'en_cuisine',
  en_preparation: 'en_cuisine',
  prete: 'pretes',
  recuperee_par_livreur: 'parties',
  en_route: 'parties',
  livree: 'terminees',
  refusee: 'terminees',
  annulee: 'terminees',
};

export function etapeDe(commande: CommandeRepas): Etape {
  return ETAPE_PAR_STATUT[commande.statut];
}

/** "à l'instant", "il y a 12 min", "il y a 2 h", then the date. */
export function anciennete(date: string, maintenant: number = Date.now()): string {
  const minutes = Math.floor((maintenant - new Date(date).getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Africa/Porto-Novo' }).format(
    new Date(date),
  );
}

/** Short order reference, the same one the client sees (last 6 characters). */
export function reference(commande: CommandeRepas): string {
  return commande.commande.id.slice(-6).toUpperCase();
}

/** Same calendar day in Benin time. */
export function estAujourdhui(date: string, maintenant: number = Date.now()): boolean {
  const jour = (d: number) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeZone: 'Africa/Porto-Novo' }).format(d);
  return jour(new Date(date).getTime()) === jour(maintenant);
}
