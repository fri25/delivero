import type { PaiementResume, StatutCoursesExpress } from '@/api/types';
import { StatutHero } from '@/components/orders/StatutHero';
import { SuiviEtapes } from '@/components/orders/SuiviEtapes';
import { suiviCoursesExpress } from '@/lib/suivi';

/**
 * Courses express tracking: plain-language status + overall timeline. The
 * stop-by-stop detail is shown separately on the detail page.
 */
export function CoursesExpressStatusStepper({
  statut,
  motif,
  paiement,
}: {
  statut: StatutCoursesExpress;
  motif?: string | null;
  paiement?: PaiementResume | null;
}) {
  const suivi = suiviCoursesExpress(statut, paiement);
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
