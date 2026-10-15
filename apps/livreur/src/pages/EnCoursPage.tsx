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
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold lg:text-3xl text-foreground">En cours</h1>
          {enCours.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs sm:text-sm font-medium text-destructive">
          Une partie de vos courses n’a pas pu être chargée. Nouvel essai automatique dans quelques secondes.
        </div>
      )}

      {isPending && taches.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-56 w-full rounded-3xl" />
        </div>
      ) : enCours.length === 0 ? (
        <div className="rounded-3xl bg-card px-6 py-12 text-center border border-border/70 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
            <Bike className="size-7" aria-hidden="true" />
          </div>
          <p className="mt-4 font-heading text-base font-bold text-foreground">Aucune course en cours</p>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Prenez une course disponible pour démarrer une livraison.</p>
          <Button asChild size="lg" className="mt-5 rounded-xl font-bold shadow-md shadow-primary/20">
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
