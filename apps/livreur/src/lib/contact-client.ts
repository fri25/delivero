// A guest order (F-CLI-02) has no client account: fall back to the name and
// phone the guest gave, so the livreur can still call them.
export function contactClient(commande: {
  client: { nom: string; telephone: string } | null;
  clientNomInvite?: string | null;
  clientTelephoneInvite?: string | null;
}): { nom: string; telephone: string } | null {
  if (commande.client) return commande.client;
  if (!commande.clientTelephoneInvite) return null;
  return { nom: commande.clientNomInvite ?? 'Client', telephone: commande.clientTelephoneInvite };
}
