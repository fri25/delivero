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
    <li data-commande={commandeId} className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icone className="size-4" aria-hidden="true" />
          </span>
          <span className="font-semibold">{SERVICE_LABELS[service]}</span>
          <span className="truncate text-muted-foreground">· {anciennete(date)}</span>
        </span>
        {statut && (
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              statutTon === 'actif' && 'bg-primary text-primary-foreground',
              statutTon === 'neutre' && 'bg-muted text-muted-foreground',
              statutTon === 'alerte' && 'bg-destructive/10 text-destructive',
            )}
          >
            {statut}
          </span>
        )}
      </div>
      {children}
    </li>
  );
}
