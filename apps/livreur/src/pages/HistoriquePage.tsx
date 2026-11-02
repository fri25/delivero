import { Skeleton } from '@/components/ui/skeleton';
import { LigneHistorique } from '@/components/taches/LigneHistorique';
import { useMesTaches } from '@/api/taches';
import { estReussie, estTerminee } from '@/lib/taches';

/** Finished tasks (delivered, cancelled, dispute), most recent first. */
export function HistoriquePage() {
  const { taches, isPending } = useMesTaches();
  const terminees = taches
    .filter((tache) => estTerminee(tache.service, tache.statut))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reussies = terminees.filter((tache) => estReussie(tache.statut)).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="titre-page">Historique</h1>
        {terminees.length > 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            <span className="font-semibold text-primary">{reussies} livrée{reussies > 1 ? 's' : ''}</span> sur {terminees.length} terminée{terminees.length > 1 ? 's' : ''} au total.
          </p>
        )}
      </header>

      {isPending && taches.length === 0 ? (
        <Skeleton className="h-40 w-full rounded-3xl" />
      ) : terminees.length === 0 ? (
        <div className="carte px-5 py-8">
          <p className="text-lg font-bold">Pas encore de course terminée</p>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Vos livraisons terminées apparaîtront ici.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {terminees.map((tache) => (
            <LigneHistorique key={`${tache.service}:${tache.id}`} tache={tache} />
          ))}
        </ul>
      )}
    </div>
  );
}
