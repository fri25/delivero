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
 * completed order also offers its "do it again" shortcut (F-CLI-07). Rows
 * sit in a ruled list (divide-y on the parent), not in cards.
 */
export function LigneCommande({
  commande,
  refaire,
}: {
  commande: CommandeResume;
  refaire?: { libelle: string; onClick?: () => void; to?: string; state?: unknown; enCours?: boolean };
}) {
  const Icone = ICONES[commande.typeService];
  const enCours = commande.issue === 'en_cours';
  return (
    <li className="py-1">
      <Link to={commande.lien} className="group flex items-center gap-3.5 py-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icone className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-bold group-hover:underline">{commande.titre}</span>
          <span className="block truncate text-sm text-muted-foreground tabular-nums">
            {TYPE_SERVICE_LABELS[commande.typeService]} · {dateCourte(commande.createdAt)}
            {commande.montantTotal ? ` · ${formatPrixFcfa(commande.montantTotal)}` : ''}
          </span>
          <span
            className={cn(
              'mt-1 inline-flex items-center gap-1.5 text-sm font-semibold',
              commande.aPayer && 'text-destructive',
              !commande.aPayer && enCours && 'text-foreground',
              !enCours && 'text-muted-foreground',
            )}
          >
            {(commande.aPayer || enCours) && (
              <span className={cn('size-2 rounded-full', commande.aPayer ? 'bg-destructive' : 'bg-brand-red')} aria-hidden="true" />
            )}
            {commande.statutLabel}
          </span>
        </span>
        <ChevronRight className="size-4.5 shrink-0 text-[#8a93a3]" strokeWidth={2} aria-hidden="true" />
      </Link>

      {refaire && (
        <div className="pb-2 pl-14.5">
          {refaire.to ? (
            <Link
              to={refaire.to}
              state={refaire.state}
              className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" /> {refaire.libelle}
            </Link>
          ) : (
            <button
              type="button"
              disabled={refaire.enCours}
              onClick={refaire.onClick}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" /> {refaire.enCours ? 'Préparation…' : refaire.libelle}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
