import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModePaiement, TypeService } from '@prisma/client';

/**
 * Garde serveur du périmètre V1 — le pendant de
 * `packages/config/perimetre-v1.ts`, qui masque les mêmes éléments côté
 * interfaces.
 *
 * Les deux sont nécessaires et volontairement indépendants : une PWA déjà
 * installée conserve son ancien bundle en cache et peut encore poster une
 * requête vers un parcours retiré. L'API doit donc refuser de son côté.
 *
 * Principe commun à toutes les gardes : seule la **création** est bloquée. Les
 * commandes déjà en base restent consultables, livrables et encaissables —
 * fermer un parcours ne doit jamais laisser une course en cours dans une
 * impasse.
 */
@Injectable()
export class PerimetreV1Service {
  constructor(private readonly config: ConfigService) {}

  private liste(cle: string): string[] {
    return (this.config.get<string>(cle) ?? '')
      .split(',')
      .map((valeur) => valeur.trim())
      .filter((valeur) => valeur.length > 0);
  }

  assertServiceOuvert(service: TypeService) {
    if (!this.liste('SERVICES_ACTIFS').includes(service)) {
      throw new ForbiddenException(
        `Le service demandé n’est pas encore ouvert.`,
      );
    }
  }

  assertModePaiementOuvert(mode: ModePaiement) {
    if (!this.liste('MODES_PAIEMENT_ACTIFS').includes(mode)) {
      throw new ForbiddenException(
        'Ce moyen de paiement n’est pas disponible. Seul le Mobile Money est accepté.',
      );
    }
  }

  /**
   * RG-04 : le contre-remboursement suppose un encaissement en espèces auprès
   * du destinataire. Retiré de la V1 en même temps que les espèces.
   */
  assertContreRemboursementOuvert(montant?: number | null) {
    if (montant === undefined || montant === null) {
      return;
    }
    if (this.config.get<boolean>('CONTRE_REMBOURSEMENT_ACTIF') !== true) {
      throw new ForbiddenException(
        'Le contre-remboursement n’est pas disponible pour le moment.',
      );
    }
  }
}
