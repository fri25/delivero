import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { useState } from 'react';
import { Inbox, PauseCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CarteTache } from '@/components/taches/CarteTache';
import { FiltreServices } from '@/components/taches/FiltreServices';
import { ActiverAlertesCard } from '@/components/taches/ActiverAlertesCard';
import { useMoi } from '@/api/livreur';
import { useTachesDisponibles } from '@/api/taches';
import type { ServiceLivreur } from '@/lib/taches';

const SERVICES: ServiceLivreur[] = EMPLETTES_ACTIF
  ? ['repas', 'colis', 'courses_express', 'emplettes']
  : ['repas', 'colis', 'courses_express'];

/**
 * Every order waiting for a livreur, all services in one list, oldest first
 * (the one waiting longest is the most urgent). Refreshed by polling.
 */
export function APrendrePage() {
  const { data: moi } = useMoi();
  const { taches, isPending, isError } = useTachesDisponibles();
  const [filtre, setFiltre] = useState<ServiceLivreur | 'tous'>('tous');

  const comptes: Partial<Record<ServiceLivreur, number>> = {};
  for (const tache of taches) comptes[tache.service] = (comptes[tache.service] ?? 0) + 1;
  const visibles = taches
    .filter((tache) => filtre === 'tous' || tache.service === filtre)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="space-y-4">
      <header>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold lg:text-3xl text-foreground">À prendre</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> En direct
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Courses disponibles à Natitingou · Les plus urgentes en premier.
        </p>
      </header>

      <ActiverAlertesCard />

      {moi && !moi.disponible && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200">
          <PauseCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>
            Vous êtes indisponible : passez « Disponible » en haut de l’écran pour qu’on vous attribue des courses.
          </span>
        </div>
      )}

      <FiltreServices services={SERVICES} comptes={comptes} valeur={filtre} onChange={setFiltre} />

      {isError && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs sm:text-sm font-medium text-destructive">
          Une partie des courses n’a pas pu être chargée. Nouvel essai automatique dans quelques secondes.
        </div>
      )}

      {isPending && taches.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-3xl bg-card px-6 py-12 text-center border border-border/70 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
            <Inbox className="size-7" aria-hidden="true" />
          </div>
          <p className="mt-4 font-heading text-base font-bold text-foreground">Rien à prendre pour le moment</p>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Les nouvelles courses apparaîtront ici automatiquement.</p>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {visibles.map((tache) => (
            <CarteTache key={`${tache.service}:${tache.id}`} tache={tache} mode="disponible" />
          ))}
        </ul>
      )}
    </div>
  );
}
