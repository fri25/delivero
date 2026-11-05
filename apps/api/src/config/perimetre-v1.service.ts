import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModePaiement, TypeService } from '@prisma/client';
import { ParametresTenantService } from '../tenancy/parametres-tenant.service';

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
 *
 * Étape 5 (docs/plan-migration-multi-tenant.md) : deux niveaux. Les variables
 * SERVICES_ACTIFS, MODES_PAIEMENT_ACTIFS et CONTRE_REMBOURSEMENT_ACTIF restent
 * le plafond de la plateforme (ce qui est ouvert techniquement) ; les
 * fonctionnalités de l'entreprise (tenant_features) décident de ce qu'elle
 * ouvre. Il faut les deux.
 */
@Injectable()
export class PerimetreV1Service {
  constructor(
    private readonly config: ConfigService,
    private readonly parametres: ParametresTenantService,
  ) {}

  private liste(cle: string): string[] {
    return (this.config.get<string>(cle) ?? '')
      .split(',')
      .map((valeur) => valeur.trim())
      .filter((valeur) => valeur.length > 0);
  }

  private async ouvertPourEntreprise(code: string): Promise<boolean> {
    return (await this.parametres.courants()).fonctionnalites.has(code);
  }

  /**
   * Features the company really opens, within the platform ceiling: what
   * the apps may show (GET /tenant, étape 6).
   */
  async fonctionnalitesOuvertes(): Promise<string[]> {
    const { fonctionnalites } = await this.parametres.courants();
    const services = this.liste('SERVICES_ACTIFS');
    const modes = this.liste('MODES_PAIEMENT_ACTIFS');
    const contreRemboursement =
      this.config.get<boolean>('CONTRE_REMBOURSEMENT_ACTIF') === true;
    return [...fonctionnalites]
      .filter((code) => {
        const [famille, valeur] = code.split('.');
        if (famille === 'service') return services.includes(valeur);
        if (famille === 'paiement') return modes.includes(valeur);
        if (code === 'colis.contre_remboursement') return contreRemboursement;
        return true;
      })
      .sort();
  }

  async assertServiceOuvert(service: TypeService) {
    if (
      !this.liste('SERVICES_ACTIFS').includes(service) ||
      !(await this.ouvertPourEntreprise(`service.${service}`))
    ) {
      throw new ForbiddenException(
        `Le service demandé n’est pas encore ouvert.`,
      );
    }
  }

  async assertModePaiementOuvert(mode: ModePaiement) {
    if (
      !this.liste('MODES_PAIEMENT_ACTIFS').includes(mode) ||
      !(await this.ouvertPourEntreprise(`paiement.${mode}`))
    ) {
      throw new ForbiddenException(
        'Ce moyen de paiement n’est pas disponible. Seul le Mobile Money est accepté.',
      );
    }
  }

  /**
   * RG-04 : le contre-remboursement suppose un encaissement en espèces auprès
   * du destinataire. Retiré de la V1 en même temps que les espèces.
   */
  async assertContreRemboursementOuvert(montant?: number | null) {
    if (montant === undefined || montant === null) {
      return;
    }
    if (
      this.config.get<boolean>('CONTRE_REMBOURSEMENT_ACTIF') !== true ||
      !(await this.ouvertPourEntreprise('colis.contre_remboursement'))
    ) {
      throw new ForbiddenException(
        'Le contre-remboursement n’est pas disponible pour le moment.',
      );
    }
  }
}
