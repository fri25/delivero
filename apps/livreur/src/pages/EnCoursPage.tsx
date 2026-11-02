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
        <div className="flex items-center justify-between">
          <h1 className="titre-page">En cours</h1>
          {enCours.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              <span className="size-2 rounded-full bg-primary" />
              {enCours.length} active{enCours.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {enCours.length > 0
            ? `${enCours.length} course${enCours.length > 1 ? 's' : ''} en cours de réalisation.`
            : 'Vos courses prises apparaissent ici avec chaque étape.'}
        </p>
      </header>

      {isError && (
        <div className="carte border border-destructive/40 p-4 text-sm font-medium text-destructive">
          Une partie de vos courses n’a pas pu être chargée. Nouvel essai automatique dans quelques secondes.
        </div>
      )}

      {isPending && taches.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-56 w-full rounded-3xl" />
        </div>
      ) : enCours.length === 0 ? (
        <div className="carte px-5 py-8">
          <p className="text-lg font-bold">Aucune course en cours</p>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Prenez une course disponible pour démarrer une livraison.</p>
          <Button asChild size="lg" className="mt-4 h-12 rounded-xl font-bold">
            <Link to="/">Voir les courses à prendre</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {enCours.map((tache) => (
            <CarteTache key={`${tache.service}:${tache.id}`} tache={tache} mode="mienne" />
          ))}
        </ul>
      )}
    </div>
  );
}
