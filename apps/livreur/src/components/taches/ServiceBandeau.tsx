import { type ReactNode } from 'react';
import { Package, ShoppingBasket, Utensils, Zap, type LucideIcon } from 'lucide-react';
import { anciennete, SERVICE_LABELS, type ServiceLivreur } from '@/lib/taches';
import { cn } from '@/lib/utils';

const ICONES: Record<ServiceLivreur, LucideIcon> = {
  repas: Utensils,
  colis: Package,
  courses_express: Zap,
  emplettes: ShoppingBasket,
};

/**
 * Frame of one task in the unified lists: which service, how long ago, and
 * its status — so a livreur scanning the list knows at a glance what it is.
 * The service card (with its own actions) goes inside.
 */
export function ServiceBandeau({
  service,
  commandeId,
  date,
  statut,
  statutTon = 'neutre',
  children,
}: {
  service: ServiceLivreur;
  /** Exposed as data-commande: lets tests (and support) find a given card. */
  commandeId: string;
  date: string;
  statut?: string;
  statutTon?: 'actif' | 'neutre' | 'alerte';
  children: ReactNode;
}) {
  const Icone = ICONES[service];
  return (
    <li data-commande={commandeId} className="carte overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <span className="flex min-w-0 items-center gap-2">
          <Icone className="size-5 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
          <span className="text-base font-bold">{SERVICE_LABELS[service]}</span>
          <span className="truncate text-sm text-muted-foreground">· {anciennete(date)}</span>
        </span>
        {statut && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold',
              statutTon === 'actif' && 'text-primary',
              statutTon === 'neutre' && 'text-muted-foreground',
              statutTon === 'alerte' && 'text-destructive',
            )}
          >
            {statutTon !== 'neutre' && (
              <span
                className={cn('size-2 rounded-full', statutTon === 'actif' ? 'bg-primary' : 'bg-destructive')}
                aria-hidden="true"
              />
            )}
            {statut}
          </span>
        )}
      </div>
      {children}
    </li>
  );
}
