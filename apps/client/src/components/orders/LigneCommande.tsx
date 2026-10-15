import { ChevronRight, Package, RotateCcw, ShoppingBasket, Utensils, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TYPE_SERVICE_LABELS, type CommandeResume } from '@/api/historique';
import type { TypeService } from '@/api/types';
import { formatPrixFcfa } from '@/lib/format';
import { cn } from '@/lib/utils';

const ICONES: Record<TypeService, typeof Utensils> = {
  repas: Utensils,
  colis: Package,
  courses_express: Zap,
  emplettes: ShoppingBasket,
};

function dateCourte(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Porto-Novo',
  }).format(new Date(value));
}

/**
 * One order in the history: the whole row opens the tracking page; a
 * completed order also offers its "do it again" shortcut (F-CLI-07).
 */
export function LigneCommande({
  commande,
  refaire,
}: {
  commande: CommandeResume;
  refaire?: { libelle: string; onClick?: () => void; to?: string; state?: unknown; enCours?: boolean };
}) {
  const Icone = ICONES[commande.typeService];
  return (
    <li className="overflow-hidden rounded-3xl bg-card border border-border/70 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/25 group">
      <Link to={commande.lien} className="flex items-center gap-3.5 p-4 sm:p-5">
        <span
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 shadow-2xs',
            commande.issue === 'en_cours'
              ? 'bg-gradient-to-br from-brand-navy to-brand-blue text-white shadow-primary/20'
              : 'bg-primary/10 text-primary',
          )}
        >
          <Icone className="size-5.5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-heading text-base font-bold text-foreground group-hover:text-primary transition-colors">
            {commande.titre}
          </span>
          <span className="block truncate text-xs sm:text-sm text-muted-foreground mt-0.5">
            {TYPE_SERVICE_LABELS[commande.typeService]} · {dateCourte(commande.createdAt)}
            {commande.montantTotal ? ` · ${formatPrixFcfa(commande.montantTotal)}` : ''}
          </span>
          <span
            className={cn(
              'mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              commande.aPayer && 'bg-brand-navy text-white shadow-2xs',
              !commande.aPayer && commande.issue === 'en_cours' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              commande.issue === 'terminee' && 'bg-secondary text-foreground/80',
              commande.issue === 'annulee' && 'bg-muted text-muted-foreground',
            )}
          >
            {!commande.aPayer && commande.issue === 'en_cours' && (
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {commande.statutLabel}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground/60 group-hover:text-primary transition-colors group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>

      {refaire && (
        <div className="border-t border-border/50 bg-secondary/25 px-4 py-2.5">
          {refaire.to ? (
            <Link
              to={refaire.to}
              state={refaire.state}
              className="inline-flex min-h-8 items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" /> {refaire.libelle}
            </Link>
          ) : (
            <button
              type="button"
              disabled={refaire.enCours}
              onClick={refaire.onClick}
              className="inline-flex min-h-8 items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" /> {refaire.enCours ? 'Préparation...' : refaire.libelle}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
