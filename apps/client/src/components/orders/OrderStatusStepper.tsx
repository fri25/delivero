import type { PaiementResume, StatutRepas } from '@/api/types';
import { StatutHero } from '@/components/orders/StatutHero';
import { SuiviEtapes } from '@/components/orders/SuiviEtapes';
import { suiviRepas } from '@/lib/suivi';

/**
 * Repas tracking: plain-language status + full timeline, up to delivery (the
 * livreur app drives recuperee_par_livreur / en_route / livree).
 */
export function OrderStatusStepper({
  statut,
  motifRefus,
  paiement,
}: {
  statut: StatutRepas;
  motifRefus: string | null;
  paiement?: PaiementResume | null;
}) {
  const suivi = suiviRepas(statut, paiement);
  return (
    <div className="space-y-4">
      <StatutHero ton={suivi.ton} titre={suivi.titre} message={suivi.message} motif={statut === 'refusee' ? motifRefus : null} />
      {suivi.indexCourant >= 0 && (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
          <SuiviEtapes etapes={suivi.etapes} indexCourant={suivi.indexCourant} termine={suivi.termine} />
        </div>
      )}
    </div>
  );
}
