import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { useState } from 'react';
import { PauseCircle } from 'lucide-react';
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
          <h1 className="titre-page">À prendre</h1>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <span className="size-2 rounded-full bg-primary" /> En direct
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Courses disponibles à Natitingou · Les plus urgentes en premier.
        </p>
      </header>

      <ActiverAlertesCard />

      {moi && !moi.disponible && (
        <div className="carte flex items-start gap-2.5 p-4 text-sm font-medium">
          <PauseCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>
            Vous êtes indisponible : passez « Disponible » en haut de l’écran pour qu’on vous attribue des courses.
          </span>
        </div>
      )}

      <FiltreServices services={SERVICES} comptes={comptes} valeur={filtre} onChange={setFiltre} />

      {isError && (
        <div className="carte border border-destructive/40 p-4 text-sm font-medium text-destructive">
          Une partie des courses n’a pas pu être chargée. Nouvel essai automatique dans quelques secondes.
        </div>
      )}

      {isPending && taches.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      ) : visibles.length === 0 ? (
        <div className="carte px-5 py-8">
          <p className="text-lg font-bold">Rien à prendre pour le moment</p>
          <p className="mt-1 text-sm text-muted-foreground">Les nouvelles courses apparaîtront ici automatiquement.</p>
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
