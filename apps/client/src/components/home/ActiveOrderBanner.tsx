import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMesCommandes } from '@/api/commandes-repas';
import { isStatutRepasActif, STATUT_REPAS_LABELS } from '@/lib/statut-repas';

/**
 * Bandeau de suivi affiché uniquement si une commande Repas non terminale
 * existe pour le client connecté (seul service livré à ce jour). Ne rend rien
 * pour un visiteur anonyme ou sans commande en cours.
 */
export function ActiveOrderBanner() {
  const { data: commandes } = useMesCommandes();
  const commandeActive = commandes?.find((commande) => isStatutRepasActif(commande.statut));

  if (!commandeActive) return null;

  return (
    <Link
      to={`/commandes/${commandeActive.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-primary-foreground/80">
          Commande en cours — {commandeActive.partenaire.nom}
        </p>
        <p className="text-sm font-semibold">{STATUT_REPAS_LABELS[commandeActive.statut]}</p>
      </div>
      <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
    </Link>
  );
}
