import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMesCommandesEmplettes } from '@/api/commandes-emplettes';
import { formatPrixFcfa } from '@/lib/format';
import { STATUT_EMPLETTES_LABELS } from '@/lib/statut-emplettes';

export function EmplettesOrdersPage() {
  const { data: commandes, isPending } = useMesCommandesEmplettes();

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
        <h1 className="text-xl font-semibold">Mes emplettes</h1>
        <Button asChild size="sm">
          <Link to="/emplettes">Nouvelle demande</Link>
        </Button>
      </div>

      {!commandes || commandes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune demande d'emplettes pour l'instant.</p>
      ) : (
        <div className="space-y-3">
          {commandes.map((commande) => (
            <Link
              key={commande.id}
              to={`/emplettes/commandes/${commande.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-brand-blue"
            >
              <div>
                <p className="font-medium">
                  {commande.articles.length} article{commande.articles.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  Budget {formatPrixFcfa(commande.budgetMax)}
                </p>
              </div>
              <Badge variant="outline">{STATUT_EMPLETTES_LABELS[commande.statut] ?? commande.statut}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
