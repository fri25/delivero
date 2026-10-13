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

const SECTIONS: { etape: Exclude<Etape, 'terminees'>; titre: string }[] = [
  { etape: 'a_accepter', titre: 'À accepter' },
  { etape: 'en_cuisine', titre: 'En cuisine' },
  { etape: 'pretes', titre: 'Prêtes, en attente du livreur' },
  { etape: 'parties', titre: 'Parties avec le livreur' },
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
    <section className="space-y-3">
      <h2 className={cn('flex items-center gap-2 font-heading text-base font-semibold', urgent && 'text-destructive')}>
        {titre}
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
            urgent ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground',
          )}
        >
          {commandes.length}
        </span>
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
  const { data: commandes, isPending, isError } = useMesCommandes();
  const { data: restaurant } = useMonRestaurant();
  const maintenant = useMaintenant();
  const [termineesOuvertes, setTermineesOuvertes] = useState(false);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Impossible de charger les commandes. Nouvel essai automatique…</p>;
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
        <p className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
          <Ban className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Votre restaurant est suspendu par ChapExpress : il n’apparaît plus aux clients et ne reçoit plus de
          commandes. Contactez ChapExpress.
        </p>
      )}

      {restaurant && !restaurant.suspendu && !restaurant.statutOuverture && (
        <p className="flex items-start gap-2 rounded-2xl bg-muted p-4 text-sm">
          <Moon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Votre restaurant est fermé : les clients ne peuvent pas commander. Appuyez sur « Fermé » en haut pour
          ouvrir.
        </p>
      )}

      {actives.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="font-heading text-lg font-semibold">Aucune commande en cours</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Une alarme sonne dès qu’un client commande. Gardez cet écran ouvert.
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
        <section className="space-y-3">
          <button
            type="button"
            aria-expanded={termineesOuvertes}
            onClick={() => setTermineesOuvertes((ouvert) => !ouvert)}
            className="flex w-full items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm font-medium"
          >
            Terminées aujourd’hui ({terminees.length})
            <ChevronDown
              className={cn('size-4 transition-transform', termineesOuvertes && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
          {termineesOuvertes && (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
