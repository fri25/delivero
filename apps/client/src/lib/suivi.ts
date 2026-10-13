import type { EtapeSuivi } from '@/components/orders/SuiviEtapes';
import type { TonStatut } from '@/components/orders/StatutHero';
import type { PaiementResume, StatutColis, StatutCoursesExpress, StatutRepas } from '@/api/types';
import { doitEtrePaye } from '@/lib/paiement';

/** Everything an order detail page needs to say where the order stands. */
export interface Suivi {
  ton: TonStatut;
  titre: string;
  message?: string;
  etapes: EtapeSuivi[];
  /** -1 when the timeline is not shown (cancelled, refused, dispute). */
  indexCourant: number;
  termine: boolean;
}

// An unpaid Mobile Money order has been sent to no one yet (see doitEtrePaye):
// that overrides whatever the service status says.
function enAttenteDePaiement(
  paiement: PaiementResume | null | undefined,
  destinataire: string,
  etapes: EtapeSuivi[],
): Suivi | undefined {
  if (!doitEtrePaye(paiement)) return undefined;
  const [premiere, ...suite] = etapes;
  return {
    ton: 'paiement',
    titre: paiement?.statut === 'echoue' ? 'Le paiement n’a pas abouti' : 'En attente de paiement',
    message: `Votre commande sera transmise ${destinataire} dès réception du paiement Mobile Money.`,
    // First step stays current, but says what it is really waiting for.
    etapes: premiere ? [{ ...premiere, detail: 'En attente de votre paiement.' }, ...suite] : etapes,
    indexCourant: 0,
    termine: false,
  };
}

const ETAPES_REPAS: { statut: StatutRepas; etape: EtapeSuivi }[] = [
  { statut: 'en_attente_acceptation', etape: { label: 'Commande envoyée', detail: 'Le restaurant doit l’accepter.' } },
  { statut: 'confirmee', etape: { label: 'Acceptée par le restaurant', detail: 'La préparation va commencer.' } },
  { statut: 'en_preparation', etape: { label: 'En préparation', detail: 'Le restaurant prépare vos plats.' } },
  { statut: 'prete', etape: { label: 'Prête', detail: 'Un livreur vient la chercher.' } },
  { statut: 'recuperee_par_livreur', etape: { label: 'Récupérée par le livreur', detail: 'Le livreur part vers vous.' } },
  { statut: 'en_route', etape: { label: 'En route vers vous', detail: 'Restez joignable sur votre téléphone.' } },
  { statut: 'livree', etape: { label: 'Livrée' } },
];

const TITRES_REPAS: Partial<Record<StatutRepas, string>> = {
  en_attente_acceptation: 'Commande envoyée au restaurant',
  confirmee: 'Commande acceptée',
  en_preparation: 'En préparation',
  prete: 'Prête, en attente du livreur',
  recuperee_par_livreur: 'Le livreur a votre commande',
  en_route: 'Votre commande arrive',
  livree: 'Commande livrée',
};

export function suiviRepas(statut: StatutRepas, paiement?: PaiementResume | null): Suivi {
  const etapes = ETAPES_REPAS.map((e) => e.etape);
  if (statut === 'refusee') {
    return { ton: 'echec', titre: 'Commande refusée par le restaurant', etapes, indexCourant: -1, termine: false };
  }
  if (statut === 'annulee') {
    return { ton: 'echec', titre: 'Commande annulée', etapes, indexCourant: -1, termine: false };
  }
  const index = ETAPES_REPAS.findIndex((e) => e.statut === statut);
  const attente = enAttenteDePaiement(paiement, 'au restaurant', etapes);
  if (attente) return attente;
  return {
    ton: statut === 'livree' ? 'succes' : 'actif',
    titre: TITRES_REPAS[statut] ?? 'Commande en cours',
    message: statut === 'livree' ? 'Bon appétit ! Dites-nous comment ça s’est passé.' : ETAPES_REPAS[index]?.etape.detail,
    etapes,
    indexCourant: index,
    termine: statut === 'livree',
  };
}

const ETAPES_COLIS: { statut: StatutColis; etape: EtapeSuivi }[] = [
  { statut: 'confirmee', etape: { label: 'Demande confirmée', detail: 'Un livreur va être désigné.' } },
  { statut: 'livreur_en_route_enlevement', etape: { label: 'Livreur en route pour l’enlèvement', detail: 'Préparez le colis.' } },
  { statut: 'colis_recupere', etape: { label: 'Colis récupéré', detail: 'Le livreur part vers le destinataire.' } },
  { statut: 'en_route', etape: { label: 'En route vers le destinataire', detail: 'Le destinataire devra donner le code de remise.' } },
  { statut: 'livre', etape: { label: 'Livré' } },
];

const TITRES_COLIS: Partial<Record<StatutColis, string>> = {
  confirmee: 'Demande confirmée',
  livreur_en_route_enlevement: 'Un livreur vient chercher le colis',
  colis_recupere: 'Colis récupéré',
  en_route: 'Colis en route',
  livre: 'Colis livré',
};

export function suiviColis(statut: StatutColis, paiement?: PaiementResume | null): Suivi {
  const etapes = ETAPES_COLIS.map((e) => e.etape);
  if (statut === 'annulee') return { ton: 'echec', titre: 'Envoi annulé', etapes, indexCourant: -1, termine: false };
  if (statut === 'litige') {
    return { ton: 'echec', titre: 'Litige en cours', message: 'Notre équipe s’en occupe et vous recontacte.', etapes, indexCourant: -1, termine: false };
  }
  const index = ETAPES_COLIS.findIndex((e) => e.statut === statut);
  const attente = enAttenteDePaiement(paiement, 'aux livreurs', etapes);
  if (attente) return attente;
  return {
    ton: statut === 'livre' ? 'succes' : 'actif',
    titre: TITRES_COLIS[statut] ?? 'Envoi en cours',
    message: statut === 'livre' ? 'Le destinataire a bien reçu le colis.' : ETAPES_COLIS[index]?.etape.detail,
    etapes,
    indexCourant: index,
    termine: statut === 'livre',
  };
}

const ETAPES_COURSES_EXPRESS: { statut: StatutCoursesExpress; etape: EtapeSuivi }[] = [
  { statut: 'confirmee', etape: { label: 'Course confirmée', detail: 'Un livreur va être désigné.' } },
  { statut: 'en_cours', etape: { label: 'Course en cours', detail: 'Le livreur réalise les arrêts, dans l’ordre.' } },
  { statut: 'terminee', etape: { label: 'Course terminée' } },
];

export function suiviCoursesExpress(statut: StatutCoursesExpress, paiement?: PaiementResume | null): Suivi {
  const etapes = ETAPES_COURSES_EXPRESS.map((e) => e.etape);
  if (statut === 'annulee') return { ton: 'echec', titre: 'Course annulée', etapes, indexCourant: -1, termine: false };
  if (statut === 'litige') {
    return { ton: 'echec', titre: 'Litige en cours', message: 'Notre équipe s’en occupe et vous recontacte.', etapes, indexCourant: -1, termine: false };
  }
  // etape_realisee is a transient state inside en_cours (one stop done, the
  // next one starts — docs/service-courses-express.md).
  const affiche = statut === 'etape_realisee' ? 'en_cours' : statut;
  const index = ETAPES_COURSES_EXPRESS.findIndex((e) => e.statut === affiche);
  const attente = enAttenteDePaiement(paiement, 'aux livreurs', etapes);
  if (attente) return attente;
  return {
    ton: statut === 'terminee' ? 'succes' : 'actif',
    titre: statut === 'terminee' ? 'Course terminée' : statut === 'confirmee' ? 'Course confirmée' : 'Le livreur est en course',
    message: statut === 'terminee' ? 'Tous les arrêts ont été réalisés.' : ETAPES_COURSES_EXPRESS[index]?.etape.detail,
    etapes,
    indexCourant: index,
    termine: statut === 'terminee',
  };
}
