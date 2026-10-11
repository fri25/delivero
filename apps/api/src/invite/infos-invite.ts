/** Who placed a guest order (F-CLI-02): no account, a name and a phone. */
export interface InfosInvite {
  nom: string;
  /** Normalised international form (+229…), see auth/telephone.ts. */
  telephone: string;
}

/**
 * Columns written on Commande for an order: either the signed-in client, or
 * the guest's contact (clientId stays null).
 */
export function demandeurCommande(
  clientId: string | null,
  invite: InfosInvite | undefined,
) {
  return invite
    ? { clientNomInvite: invite.nom, clientTelephoneInvite: invite.telephone }
    : { clientId };
}

/**
 * Who acts on an existing order: a signed-in client (user id), or a guest
 * holding the verified tracking link of that very order.
 */
export type Demandeur = string | { commandeInviteId: string };

export function estDemandeur(
  commande: { id: string; clientId: string | null },
  demandeur: Demandeur,
): boolean {
  if (typeof demandeur === 'string') {
    return commande.clientId === demandeur;
  }
  return (
    commande.clientId === null && commande.id === demandeur.commandeInviteId
  );
}
