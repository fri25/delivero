import { Skeleton } from '@/components/ui/skeleton';
import { MonColisCard } from '@/components/colis/MonColisCard';
import { useMesColis } from '@/api/commandes-colis';

const STATUTS_TERMINES = ['livre', 'annulee', 'litige'];

export function MesColisPage() {
  const { data: commandes, isPending } = useMesColis();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!commandes || commandes.length === 0) {
    return (
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Mes colis</h1>
        <p className="text-sm text-muted-foreground">Aucun colis pris en charge pour l'instant.</p>
      </div>
    );
  }

  const enCours = commandes.filter((commande) => !STATUTS_TERMINES.includes(commande.statut));
  const termines = commandes.filter((commande) => STATUTS_TERMINES.includes(commande.statut));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Mes colis</h1>

      {enCours.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">En cours ({enCours.length})</h2>
          <div className="space-y-3">
            {enCours.map((commande) => (
              <MonColisCard key={commande.id} commande={commande} />
            ))}
          </div>
        </div>
      )}

      {termines.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Terminés</h2>
          <div className="space-y-3">
            {termines.map((commande) => (
              <MonColisCard key={commande.id} commande={commande} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
