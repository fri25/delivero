import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TYPE_SERVICE_LABELS, useHistoriqueCommandes } from '@/api/historique';

/**
 * Bandeau de suivi (style Live Activity) affiché dès qu'au moins une commande
 * non terminale est en cours : aplat bleu, point rouge « en direct ».
 */
export function ActiveOrderBanner() {
  const { commandes } = useHistoriqueCommandes();
  const actives = commandes.filter((commande) => commande.actif);
  const commandeActive = actives.at(0);

  if (!commandeActive) return null;

  const plusieurs = actives.length > 1;

  return (
    <Link
      to={plusieurs ? '/commandes' : commandeActive.lien}
      className="group flex items-center justify-between gap-3 rounded-2xl bg-primary p-3.5 text-primary-foreground transition-[filter,transform] duration-(--duration-fast) hover:brightness-110 active:scale-[0.99] md:p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative flex size-3.5 shrink-0 items-center justify-center" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-red opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-brand-red ring-2 ring-white" />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-1 text-[11px] font-semibold tracking-wide text-primary-foreground/80 uppercase">
            {plusieurs
              ? `${actives.length} commandes en cours`
              : `${TYPE_SERVICE_LABELS[commandeActive.typeService]} en cours`}
          </p>
          <p className="truncate text-sm font-bold md:text-base">
            {plusieurs ? 'Voir le suivi en direct' : `${commandeActive.statutLabel} · ${commandeActive.titre}`}
          </p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary">
        <span>Suivre</span>
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
