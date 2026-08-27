import { Skeleton } from '@/components/ui/skeleton';
import { CommandeCard } from '@/components/commandes/CommandeCard';
import { useMesCommandes } from '@/api/commandes';

export function OrdersPage() {
  const { data: commandes, isPending } = useMesCommandes();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!commandes || commandes.length === 0) {
    return (
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Commandes</h1>
        <p className="text-sm text-muted-foreground">Aucune commande pour l'instant.</p>
      </div>
    );
  }

  const enAttente = commandes.filter((commande) => commande.statut === 'en_attente_acceptation');
  const autres = commandes.filter((commande) => commande.statut !== 'en_attente_acceptation');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Commandes</h1>

      {enAttente.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-destructive">
            En attente de votre décision ({enAttente.length})
          </h2>
          <div className="space-y-3">
            {enAttente.map((commande) => (
              <CommandeCard key={commande.id} commande={commande} />
            ))}
          </div>
        </div>
      )}

      {autres.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Autres commandes</h2>
          <div className="space-y-3">
            {autres.map((commande) => (
              <CommandeCard key={commande.id} commande={commande} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
