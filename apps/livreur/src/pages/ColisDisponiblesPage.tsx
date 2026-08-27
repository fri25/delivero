import { Skeleton } from '@/components/ui/skeleton';
import { ColisDisponibleCard } from '@/components/colis/ColisDisponibleCard';
import { useColisDisponibles } from '@/api/commandes-colis';

export function ColisDisponiblesPage() {
  const { data: commandes, isPending } = useColisDisponibles();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Colis à enlever</h1>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !commandes || commandes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun colis disponible pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {commandes.map((commande) => (
            <ColisDisponibleCard key={commande.id} commande={commande} />
          ))}
        </div>
      )}
    </div>
  );
}
