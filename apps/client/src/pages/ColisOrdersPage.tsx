import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMesCommandesColis } from '@/api/commandes-colis';
import { formatPrixFcfa } from '@/lib/format';
import { STATUT_COLIS_LABELS } from '@/lib/statut-colis';

export function ColisOrdersPage() {
  const { data: commandes, isPending } = useMesCommandesColis();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mes colis</h1>
        <Button asChild size="sm">
          <Link to="/colis">Nouvelle demande</Link>
        </Button>
      </div>

      {!commandes || commandes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun colis envoyé pour l'instant.</p>
      ) : (
        <div className="space-y-3">
          {commandes.map((commande) => (
            <Link
              key={commande.id}
              to={`/colis/commandes/${commande.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-brand-blue"
            >
              <div>
                <p className="font-medium">{commande.destinataireNom}</p>
                <p className="text-sm text-muted-foreground">
                  {commande.commande.montantTotal ? formatPrixFcfa(commande.commande.montantTotal) : '—'}
                </p>
              </div>
              <Badge variant="outline">{STATUT_COLIS_LABELS[commande.statut] ?? commande.statut}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
