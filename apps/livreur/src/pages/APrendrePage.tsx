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
        <h1 className="font-heading text-2xl font-semibold">À prendre</h1>
        <p className="text-sm text-muted-foreground">
          Les plus anciennes en premier. Les nouvelles courses s’affichent toutes seules.
        </p>
      </header>

      <ActiverAlertesCard />

      {moi && !moi.disponible && (
        <p className="flex items-start gap-2 rounded-2xl bg-muted p-3 text-sm">
          <PauseCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Vous êtes indisponible : passez « Disponible » en haut de l’écran pour qu’on vous attribue des courses.
        </p>
      )}

      <FiltreServices services={SERVICES} comptes={comptes} valeur={filtre} onChange={setFiltre} />

      {isError && (
        <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
          Une partie des courses n’a pas pu être chargée. Nouvel essai automatique dans quelques secondes.
        </p>
      )}

      {isPending && taches.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
          <Inbox className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-semibold">Rien à prendre pour le moment</p>
          <p className="text-sm text-muted-foreground">Les nouvelles courses apparaîtront ici automatiquement.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibles.map((tache) => (
            <CarteTache key={`${tache.service}:${tache.id}`} tache={tache} mode="disponible" />
          ))}
        </ul>
      )}
    </div>
  );
}
