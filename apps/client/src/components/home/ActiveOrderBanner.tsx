import { Link } from 'react-router-dom';
import { TYPE_SERVICE_LABELS, useHistoriqueCommandes } from '@/api/historique';

/**
 * Bandeau de suivi affiché dès qu'au moins une commande non terminale est en
 * cours : aplat marine, point rouge « en direct ». Seul élément de l'accueil
 * qui attire l'œil : rien d'autre n'utilise le marine en aplat.
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
      className="flex items-center gap-3 rounded-2xl bg-brand-navy px-4 py-3.5 text-white md:px-5"
    >
      <span className="size-2 shrink-0 rounded-full bg-[#ff5a61]" aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col md:flex-row md:items-baseline md:gap-3">
        <span className="truncate text-xs text-[#c4d0e8] md:order-2 md:text-[15px]">
          {plusieurs
            ? `${actives.length} commandes en cours`
            : `${TYPE_SERVICE_LABELS[commandeActive.typeService]} · ${commandeActive.titre}`}
        </span>
        <span className="truncate text-[15px] font-bold">
          {plusieurs ? 'Voir le suivi en direct' : commandeActive.statutLabel}
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold underline-offset-4 hover:underline">Suivre</span>
    </Link>
  );
}
