import { useState } from 'react';
import { Ban, ChevronDown, Moon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ActiverAlertesCard } from '@/components/commandes/ActiverAlertesCard';
import { CommandeCard } from '@/components/commandes/CommandeCard';
import { useMesCommandes } from '@/api/commandes';
import { useMonRestaurant } from '@/api/restaurant';
import { estAujourdhui, etapeDe, type Etape } from '@/lib/commandes';
import { useMaintenant } from '@/lib/maintenant';
import { cn } from '@/lib/utils';
import type { CommandeRepas } from '@/api/types';
import { useEntreprise } from '@/lib/entreprise';

const SECTIONS: { etape: Exclude<Etape, 'terminees'>; titre: string; accentClass: string }[] = [
  { etape: 'a_accepter', titre: 'À accepter en priorité', accentClass: 'text-destructive bg-destructive/10 border-destructive/30' },
  { etape: 'en_cuisine', titre: 'En cuisine', accentClass: 'text-amber-600 bg-amber-50 border-amber-200' },
  { etape: 'pretes', titre: 'Prêtes, en attente du livreur', accentClass: 'text-primary bg-accent border-transparent' },
  { etape: 'parties', titre: 'Parties avec le livreur', accentClass: 'text-brand-blue bg-blue-50 border-blue-200' },
];

function Section({
  titre,
  commandes,
  maintenant,
  urgent = false,
}: {
  titre: string;
  commandes: CommandeRepas[];
  maintenant: number;
  urgent?: boolean;
}) {
  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className={cn('flex items-center gap-2.5 font-heading text-base font-bold', urgent ? 'text-destructive' : 'text-foreground')}>
          <span
            className={cn(
              'size-2.5 rounded-full',
              urgent ? 'bg-brand-red' : 'bg-primary/80',
            )}
            aria-hidden="true"
          />
          {titre}
        </h2>
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
            urgent ? 'bg-brand-red text-white' : 'bg-muted text-muted-foreground border border-border/60',
          )}
        >
          {commandes.length}
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {commandes.map((commande) => (
          <CommandeCard key={commande.id} commande={commande} maintenant={maintenant} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Kitchen board (F-RES-01 to 03): orders grouped by what the kitchen has to do
 * next, the ones waiting for a decision first. Finished orders of the day stay
 * folded at the bottom.
 */
export function OrdersPage() {
  const entreprise = useEntreprise();
  const { data: commandes, isPending, isError } = useMesCommandes();
  const { data: restaurant } = useMonRestaurant();
  const maintenant = useMaintenant();
  const [termineesOuvertes, setTermineesOuvertes] = useState(false);

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48 rounded-xl" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="carte border border-destructive/40 p-6 text-destructive">
        <p className="text-base font-semibold">Impossible de charger les commandes</p>
        <p className="mt-1 text-xs text-muted-foreground">Une tentative de reconnexion est en cours automatiquement…</p>
      </div>
    );
  }

  const parEtape = (etape: Etape) => commandes.filter((commande) => etapeDe(commande) === etape);
  const terminees = parEtape('terminees').filter((commande) => estAujourdhui(commande.createdAt, maintenant));
  const actives = SECTIONS.map((section) => ({ ...section, commandes: parEtape(section.etape) })).filter(
    (section) => section.commandes.length > 0,
  );

  return (
    <div className="space-y-6">
      <ActiverAlertesCard />

      {restaurant?.suspendu && (
        <div className="carte flex items-start gap-3 border border-destructive/40 p-4 text-sm text-destructive sm:p-5">
          <Ban className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-base font-bold">Établissement suspendu</p>
            <p className="mt-1 text-xs sm:text-sm text-destructive/90 leading-relaxed">
              Votre restaurant est suspendu par {entreprise.nomCommercial} : il n’apparaît plus aux clients et ne reçoit plus de
              commandes. Contactez le service support {entreprise.nomCommercial}.
            </p>
          </div>
        </div>
      )}

      {restaurant && !restaurant.suspendu && !restaurant.statutOuverture && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-100 p-4 text-sm text-amber-950 sm:p-5">
          <Moon className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="text-base font-bold">Restaurant actuellement fermé</p>
            <p className="mt-1 text-xs sm:text-sm text-amber-800/90 leading-relaxed">
              Les clients ne peuvent pas passer commande pour le moment. Cliquez sur le bouton « Fermé » dans l'en-tête
              pour réouvrir immédiatement.
            </p>
          </div>
        </div>
      )}

      {actives.length === 0 ? (
        <div className="carte flex flex-col items-start p-6">
          <p className="text-lg font-bold">Écran de cuisine actif</p>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Aucune commande en attente. Une alarme sonore retentit dès qu’un client commande. Laissez cet écran ouvert.
          </p>
        </div>
      ) : (
        actives.map((section) => (
          <Section
            key={section.etape}
            titre={section.titre}
            commandes={section.commandes}
            maintenant={maintenant}
            urgent={section.etape === 'a_accepter'}
          />
        ))
      )}

      {terminees.length > 0 && (
        <section className="space-y-3 pt-2">
          <button
            type="button"
            aria-expanded={termineesOuvertes}
            onClick={() => setTermineesOuvertes((ouvert) => !ouvert)}
            className="carte flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold"
          >
            <span className="flex items-center gap-2">
              <span>Commandes terminées aujourd’hui</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                {terminees.length}
              </span>
            </span>
            <ChevronDown
              className={cn('size-4 text-muted-foreground transition-transform duration-200', termineesOuvertes && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
          {termineesOuvertes && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {terminees.map((commande) => (
                <CommandeCard key={commande.id} commande={commande} maintenant={maintenant} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
