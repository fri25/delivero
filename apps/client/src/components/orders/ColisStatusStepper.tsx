import type { PaiementResume, StatutColis } from '@/api/types';
import { StatutHero } from '@/components/orders/StatutHero';
import { SuiviEtapes } from '@/components/orders/SuiviEtapes';
import { suiviColis } from '@/lib/suivi';

/** Colis tracking: plain-language status + full timeline. */
export function ColisStatusStepper({
  statut,
  motif,
  paiement,
}: {
  statut: StatutColis;
  motif?: string | null;
  paiement?: PaiementResume | null;
}) {
  const suivi = suiviColis(statut, paiement);
  return (
    <div className="space-y-4">
      <StatutHero ton={suivi.ton} titre={suivi.titre} message={suivi.message} motif={statut === 'litige' ? motif : null} />
      {suivi.indexCourant >= 0 && (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
          <SuiviEtapes etapes={suivi.etapes} indexCourant={suivi.indexCourant} termine={suivi.termine} />
        </div>
      )}
    </div>
  );
}
