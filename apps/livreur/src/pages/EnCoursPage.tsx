import { Bike } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CarteTache } from '@/components/taches/CarteTache';
import { useMesTaches } from '@/api/taches';
import { estTerminee } from '@/lib/taches';

/** What this livreur is doing now, all services; each card ends on its next action. */
export function EnCoursPage() {
  const { taches, isPending, isError } = useMesTaches();
  const enCours = taches
    .filter((tache) => !estTerminee(tache.service, tache.statut))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-heading text-2xl font-semibold">En cours</h1>
        <p className="text-sm text-muted-foreground">
          {enCours.length > 0
            ? `${enCours.length} course${enCours.length > 1 ? 's' : ''} à terminer`
            : 'Vos courses prises apparaissent ici.'}
        </p>
      </header>

      {isError && (
        <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
          Une partie de vos courses n’a pas pu être chargée. Nouvel essai automatique dans quelques secondes.
        </p>
      )}

      {isPending && taches.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      ) : enCours.length === 0 ? (
        <div className="rounded-2xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
          <Bike className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-semibold">Aucune course en cours</p>
          <p className="text-sm text-muted-foreground">Prenez une course dans l’onglet « À prendre ».</p>
          <Button asChild className="mt-4">
            <Link to="/">Voir les courses à prendre</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {enCours.map((tache) => (
            <CarteTache key={`${tache.service}:${tache.id}`} tache={tache} mode="mienne" />
          ))}
        </ul>
      )}
    </div>
  );
}
