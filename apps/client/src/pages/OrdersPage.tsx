import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMesCommandes } from '@/api/commandes-repas';
import { formatPrixFcfa } from '@/lib/format';
import { STATUT_REPAS_LABELS } from '@/lib/statut-repas';

export function OrdersPage() {
  const { data: commandes, isPending } = useMesCommandes();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!commandes || commandes.length === 0) {
    return <p className="text-sm text-muted-foreground">Vous n'avez pas encore commandé.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mes commandes</h1>

      <div className="space-y-3">
        {commandes.map((commande) => (
          <Link
            key={commande.id}
            to={`/commandes/${commande.id}`}
            className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-brand-blue"
          >
            <div>
              <p className="font-medium">{commande.partenaire.nom}</p>
              <p className="text-sm text-muted-foreground">
                {commande.commande.montantTotal ? formatPrixFcfa(commande.commande.montantTotal) : '—'}
              </p>
            </div>
            <Badge variant="outline">{STATUT_REPAS_LABELS[commande.statut] ?? commande.statut}</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
