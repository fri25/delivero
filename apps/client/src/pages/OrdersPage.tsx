import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TYPE_SERVICE_LABELS, useHistoriqueCommandes } from '@/api/historique';
import { formatPrixFcfa } from '@/lib/format';

// F-CLI-06 : historique unifié, tous services confondus, du plus récent au
// plus ancien.
export function OrdersPage() {
  const { commandes, isPending, isError } = useHistoriqueCommandes();

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
      <h1 className="text-xl font-semibold">Mes commandes</h1>

      {isError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Une partie de vos commandes n'a pas pu être chargée. Vérifiez votre connexion.
        </p>
      )}

      {commandes.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Vous n'avez pas encore commandé.</p>
          <Button asChild size="sm">
            <Link to="/">Choisir un service</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {commandes.map((commande) => (
            <Link
              key={`${commande.typeService}-${commande.id}`}
              to={commande.lien}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:border-brand-blue"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {TYPE_SERVICE_LABELS[commande.typeService]} ·{' '}
                  {new Date(commande.createdAt).toLocaleDateString('fr-FR')}
                </p>
                <p className="line-clamp-1 font-medium">{commande.titre}</p>
                <p className="text-sm text-muted-foreground">
                  {commande.montantTotal ? formatPrixFcfa(commande.montantTotal) : '—'}
                </p>
              </div>
              <Badge variant={commande.actif ? 'default' : 'outline'} className="shrink-0">
                {commande.statutLabel}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
