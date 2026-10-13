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
    <li className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
      <Link to={commande.lien} className="flex items-center gap-3 p-3 sm:p-4">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            commande.issue === 'en_cours' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary',
          )}
        >
          <Icone className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{commande.titre}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {TYPE_SERVICE_LABELS[commande.typeService]} · {dateCourte(commande.createdAt)}
            {commande.montantTotal ? ` · ${formatPrixFcfa(commande.montantTotal)}` : ''}
          </span>
          <span
            className={cn(
              'mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
              commande.aPayer && 'bg-brand-navy text-white',
              !commande.aPayer && commande.issue === 'en_cours' && 'bg-primary/10 text-primary',
              commande.issue === 'terminee' && 'bg-secondary text-foreground',
              commande.issue === 'annulee' && 'bg-muted text-muted-foreground',
            )}
          >
            {commande.statutLabel}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>

      {refaire && (
        <div className="border-t border-border px-3 py-2 sm:px-4">
          {refaire.to ? (
            <Link
              to={refaire.to}
              state={refaire.state}
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <RotateCcw className="size-4" aria-hidden="true" /> {refaire.libelle}
            </Link>
          ) : (
            <button
              type="button"
              disabled={refaire.enCours}
              onClick={refaire.onClick}
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
            >
              <RotateCcw className="size-4" aria-hidden="true" /> {refaire.enCours ? 'Préparation...' : refaire.libelle}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
