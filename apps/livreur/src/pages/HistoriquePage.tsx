import { History } from 'lucide-react';
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
        <h1 className="font-heading text-2xl font-semibold">Historique</h1>
        {terminees.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {reussies} livrée{reussies > 1 ? 's' : ''} sur {terminees.length} terminée{terminees.length > 1 ? 's' : ''}
          </p>
        )}
      </header>

      {isPending && taches.length === 0 ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : terminees.length === 0 ? (
        <div className="rounded-2xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
          <History className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-semibold">Pas encore de course terminée</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {terminees.map((tache) => (
            <LigneHistorique key={`${tache.service}:${tache.id}`} tache={tache} />
          ))}
        </ul>
      )}
    </div>
  );
}
