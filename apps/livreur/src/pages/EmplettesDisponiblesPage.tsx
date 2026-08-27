import { Skeleton } from '@/components/ui/skeleton';
import { EmplettesDisponibleCard } from '@/components/emplettes/EmplettesDisponibleCard';
import { useEmplettesDisponibles } from '@/api/commandes-emplettes';

export function EmplettesDisponiblesPage() {
  const { data: commandes, isPending } = useEmplettesDisponibles();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Emplettes disponibles</h1>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !commandes || commandes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune commande disponible pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {commandes.map((commande) => (
            <EmplettesDisponibleCard key={commande.id} commande={commande} />
          ))}
        </div>
      )}
    </div>
  );
}
