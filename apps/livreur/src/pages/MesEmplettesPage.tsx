import { Skeleton } from '@/components/ui/skeleton';
import { MonEmplettesCard } from '@/components/emplettes/MonEmplettesCard';
import { useMesEmplettes } from '@/api/commandes-emplettes';

const STATUTS_TERMINES = ['livree', 'annulee', 'litige'];

export function MesEmplettesPage() {
  const { data: commandes, isPending } = useMesEmplettes();

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
        <h1 className="text-xl font-semibold">Mes emplettes</h1>
        <p className="text-sm text-muted-foreground">Aucune commande prise en charge pour l'instant.</p>
      </div>
    );
  }

  const enCours = commandes.filter((commande) => !STATUTS_TERMINES.includes(commande.statut));
  const termines = commandes.filter((commande) => STATUTS_TERMINES.includes(commande.statut));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Mes emplettes</h1>

      {enCours.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">En cours ({enCours.length})</h2>
          <div className="space-y-3">
            {enCours.map((commande) => (
              <MonEmplettesCard key={commande.id} commande={commande} />
            ))}
          </div>
        </div>
      )}

      {termines.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Terminées</h2>
          <div className="space-y-3">
            {termines.map((commande) => (
              <MonEmplettesCard key={commande.id} commande={commande} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
