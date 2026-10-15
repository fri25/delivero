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
    <li data-commande={commandeId} className="overflow-hidden rounded-3xl bg-card border border-border/70 shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/25">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-secondary/35 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2.5 text-sm">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-navy to-brand-blue text-white shadow-2xs">
            <Icone className="size-4.5" aria-hidden="true" />
          </span>
          <span className="font-heading font-bold text-foreground text-sm">{SERVICE_LABELS[service]}</span>
          <span className="truncate text-xs text-muted-foreground font-medium">· {anciennete(date)}</span>
        </span>
        {statut && (
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              statutTon === 'actif' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5',
              statutTon === 'neutre' && 'bg-secondary text-foreground/80 font-medium',
              statutTon === 'alerte' && 'bg-destructive/10 text-destructive border border-destructive/20 font-bold',
            )}
          >
            {statutTon === 'actif' && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            {statut}
          </span>
        )}
      </div>
      {children}
    </li>
  );
}
