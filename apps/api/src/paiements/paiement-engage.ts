import { BadRequestException } from '@nestjs/common';
import { Prisma, StatutPaiement } from '@prisma/client';

// Decision of 2026-10-05: the client pays when placing the order. An order
// whose Mobile Money payment has not gone through (en_attente, echoue) exists
// for nobody but the client: restaurant, livreurs and dispatch must not see it.
//
// "Engaged" = collected (reussi), due on delivery (a_percevoir_livraison,
// cash), or already collected once (a_rembourser, rembourse — the order stays
// in the partner's history).
const STATUTS_NON_ENGAGES: StatutPaiement[] = [
  StatutPaiement.en_attente,
  StatutPaiement.echoue,
];

/** Prisma filter for `Commande.paiement`. */
export const PAIEMENT_ENGAGE_WHERE = {
  statut: { notIn: STATUTS_NON_ENGAGES },
} satisfies Prisma.PaiementWhereInput;

export function estPaiementEngage(
  paiement: { statut: StatutPaiement } | null | undefined,
): boolean {
  // No Paiement row: orders older than this module, do not block them.
  return !paiement || !STATUTS_NON_ENGAGES.includes(paiement.statut);
}

export function assertPaiementEngage(
  paiement: { statut: StatutPaiement } | null | undefined,
) {
  if (!estPaiementEngage(paiement)) {
    throw new BadRequestException(
      "Cette commande n'est pas encore payée par le client.",
    );
  }
}

/**
 * Refusal or cancellation of an already collected order: the payment moves to
 * `a_rembourser`, refunded by hand from the back-office (no automatic FedaPay
 * refund in V1). No-op when nothing was collected.
 */
export function marquerARembourserSiPaye(
  db: Prisma.TransactionClient,
  commandeId: string,
) {
  return db.paiement.updateMany({
    where: { commandeId, statut: StatutPaiement.reussi },
    data: { statut: StatutPaiement.a_rembourser },
  });
}
