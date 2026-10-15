import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TYPE_SERVICE_LABELS, useHistoriqueCommandes } from '@/api/historique';

/**
 * Bandeau de suivi moderne en temps réel (style Live Activity) affiché dès qu'au
 * moins une commande non terminale est en cours.
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
      className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-navy via-[#0c2f66] to-brand-blue p-3.5 md:p-4 text-white shadow-md transition-all duration-300 hover:shadow-lg hover:brightness-105 active:scale-[0.99] ring-1 ring-white/10"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="relative flex size-3.5 shrink-0 items-center justify-center">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400 shadow-xs" />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-1 text-xs font-semibold text-white/80 tracking-wide uppercase">
            {plusieurs
              ? `${actives.length} commandes en cours`
              : `${TYPE_SERVICE_LABELS[commandeActive.typeService]} en cours`}
          </p>
          <p className="truncate text-sm md:text-base font-bold text-white drop-shadow-xs">
            {plusieurs ? 'Voir le suivi en direct' : `${commandeActive.statutLabel} · ${commandeActive.titre}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs transition-colors group-hover:bg-white/25">
        <span>Suivre</span>
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  );
}
