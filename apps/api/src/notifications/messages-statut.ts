import type { TypeService } from '@prisma/client';

export interface Notification {
  titre: string;
  message: string;
  /** Client app path opened when the notification is tapped. */
  url?: string;
}

// F-CLI-09: only the key steps are pushed to the client; intermediate
// statuses stay visible in the app (real-time + polling). Keyed by service,
// then by service-specific status value.
const ETAPES_CLES: Record<
  TypeService,
  Record<string, Omit<Notification, 'url'>>
> = {
  repas: {
    confirmee: {
      titre: 'Commande acceptée',
      message: 'Le restaurant prépare votre commande.',
    },
    refusee: {
      titre: 'Commande refusée',
      message:
        'Le restaurant ne peut pas honorer votre commande. Si vous avez payé, vous serez remboursé.',
    },
    en_route: {
      titre: 'Commande en route',
      message: 'Votre livreur est en chemin.',
    },
    livree: { titre: 'Commande livrée', message: 'Bon appétit !' },
  },
  colis: {
    livreur_en_route_enlevement: {
      titre: 'Livreur en route',
      message: 'Un livreur vient récupérer votre colis.',
    },
    colis_recupere: {
      titre: 'Colis récupéré',
      message: 'Votre colis est pris en charge.',
    },
    livre: {
      titre: 'Colis livré',
      message: 'Votre colis a été remis au destinataire.',
    },
  },
  courses_express: {
    en_cours: {
      titre: 'Course prise en charge',
      message: 'Un livreur s’occupe de votre course.',
    },
    terminee: {
      titre: 'Course terminée',
      message: 'Toutes les étapes de votre course sont réalisées.',
    },
  },
  emplettes: {
    achats_en_cours: {
      titre: 'Achats en cours',
      message: 'Votre livreur fait vos courses.',
    },
    validation_depassement: {
      titre: 'Budget dépassé',
      message:
        'Votre livreur attend votre accord pour dépasser le budget. Ouvrez la commande pour répondre.',
    },
    en_route: {
      titre: 'Emplettes en route',
      message: 'Votre livreur arrive avec vos achats.',
    },
    livree: {
      titre: 'Emplettes livrées',
      message: 'Vos achats ont été livrés.',
    },
  },
};

const CHEMINS: Record<TypeService, string> = {
  repas: '/commandes',
  colis: '/colis/commandes',
  courses_express: '/courses-express/commandes',
  emplettes: '/emplettes/commandes',
};

export function cheminCommande(
  typeService: TypeService,
  commandeServiceId: string,
): string {
  return `${CHEMINS[typeService]}/${commandeServiceId}`;
}

export function notificationStatut(
  typeService: TypeService,
  commandeServiceId: string,
  statut: string,
): Notification | null {
  const etape = ETAPES_CLES[typeService][statut];
  if (!etape) {
    return null;
  }
  return { ...etape, url: cheminCommande(typeService, commandeServiceId) };
}
