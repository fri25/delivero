import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TYPE_SERVICE_LABELS, useHistoriqueCommandes } from '@/api/historique';

/**
 * Bandeau de suivi affiché si au moins une commande non terminale existe pour
 * le client connecté, tous services confondus. Pointe vers la plus récente ;
 * s'il y en a plusieurs, renvoie vers l'historique. Ne rend rien pour un
 * visiteur anonyme ou sans commande en cours.
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
      className="flex items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
    >
      <div className="min-w-0">
        <p className="line-clamp-1 text-xs font-medium text-primary-foreground/80">
          {plusieurs
            ? `${actives.length} commandes en cours`
            : `${TYPE_SERVICE_LABELS[commandeActive.typeService]} en cours — ${commandeActive.titre}`}
        </p>
        <p className="text-sm font-semibold">
          {plusieurs ? 'Voir le suivi' : commandeActive.statutLabel}
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
    </Link>
  );
}
