import type { ServiceLivreur } from './taches';

/**
 * A livreur action kept on the phone while offline (docs/pwa-offline.md):
 * replayed in write order when the network comes back. The server stays the
 * only judge of the final state.
 */
export interface ActionEnFile {
  /** Idempotency id, also the queue key. */
  id: string;
  /** Actions of another account on a shared phone are never replayed. */
  userId: string;
  /** What the livreur did, shown in the sync banner ("Colis récupéré"). */
  libelle: string;
  service: ServiceLivreur;
  /** Service order id (CommandeColis.id…). */
  commandeId: string;
  methode: 'PATCH' | 'POST';
  chemin: string;
  corps?: unknown;
  /**
   * Expected server state once applied. Lets a replay recognise an action
   * the server already received (request sent, answer lost on 3G).
   */
  attendu: { statut?: string; etapeId?: string };
  creeLe: string;
  /** Set when the server refused it: kept for the livreur to handle. */
  erreur?: string;
}

/** The network is down (no answer at all): retry later, keep the order. */
export class ErreurReseau extends Error {
  constructor() {
    super('Pas de réseau.');
    this.name = 'ErreurReseau';
  }
}

/** The server answered with an error status. */
export class ErreurServeur extends Error {
  readonly statut: number;

  constructor(statut: number, message: string) {
    super(message);
    this.name = 'ErreurServeur';
    this.statut = statut;
  }
}

export interface ResultatRejeu {
  /** Applied (or found already applied): to remove from the queue. */
  reussies: string[];
  /** Refused by the server: kept, flagged with the reason. */
  refusees: { id: string; erreur: string }[];
  /** Stopped early because the network dropped again. */
  interrompu: boolean;
}

/**
 * Replays `actions` in order. `envoyer` performs the request (throws
 * ErreurReseau / ErreurServeur); `dejaAppliquee` checks the server state
 * after a refusal. Once an action of an order is refused, the following
 * actions of that same order are left untouched (they depend on it).
 */
export async function rejouer(
  actions: ActionEnFile[],
  envoyer: (action: ActionEnFile) => Promise<void>,
  dejaAppliquee: (action: ActionEnFile) => Promise<boolean>,
): Promise<ResultatRejeu> {
  const resultat: ResultatRejeu = { reussies: [], refusees: [], interrompu: false };
  const bloquees = new Set<string>();

  for (const action of actions) {
    const cle = `${action.service}:${action.commandeId}`;
    if (action.erreur || bloquees.has(cle)) {
      bloquees.add(cle);
      continue;
    }
    try {
      await envoyer(action);
      resultat.reussies.push(action.id);
    } catch (error) {
      // No network, or a server error (5xx): try again later, in order.
      if (error instanceof ErreurReseau || (error instanceof ErreurServeur && error.statut >= 500)) {
        resultat.interrompu = true;
        return resultat;
      }
      const message = error instanceof Error ? error.message : 'Action refusée.';
      let appliquee = false;
      try {
        appliquee = await dejaAppliquee(action);
      } catch {
        // Could not check: treat as refused, the livreur decides.
      }
      if (appliquee) {
        resultat.reussies.push(action.id);
      } else {
        resultat.refusees.push({ id: action.id, erreur: message });
        bloquees.add(cle);
      }
    }
  }
  return resultat;
}

// Status order of each service, from the livreur's first action on. Used to
// recognise an action the server already applied — or went past.
const PROGRESSION: Record<ServiceLivreur, string[]> = {
  repas: ['prete', 'recuperee_par_livreur', 'en_route', 'livree'],
  colis: ['confirmee', 'livreur_en_route_enlevement', 'colis_recupere', 'en_route', 'livre'],
  courses_express: ['confirmee', 'en_cours', 'etape_realisee', 'terminee'],
  emplettes: ['confirmee', 'achats_en_cours', 'validation_depassement', 'achats_termines', 'en_route', 'livree'],
};

/** True when the server status equals `cible`, or is further along. */
export function statutAtteint(service: ServiceLivreur, statutServeur: string, cible: string): boolean {
  if (statutServeur === cible) return true;
  const ordre = PROGRESSION[service];
  const serveur = ordre.indexOf(statutServeur);
  const attendu = ordre.indexOf(cible);
  return serveur >= 0 && attendu >= 0 && serveur >= attendu;
}
