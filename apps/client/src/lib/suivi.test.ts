import { describe, expect, it } from 'vitest';
import { suiviColis, suiviCoursesExpress, suiviRepas } from './suivi';

const PAYE = { mode: 'mobile_money', statut: 'reussi' } as const;
const NON_PAYE = { mode: 'mobile_money', statut: 'en_attente' } as const;

describe('suiviRepas', () => {
  it('marks every step done once delivered', () => {
    const suivi = suiviRepas('livree', PAYE);
    expect(suivi.termine).toBe(true);
    expect(suivi.indexCourant).toBe(suivi.etapes.length - 1);
    expect(suivi.ton).toBe('succes');
  });

  it('follows the livreur steps after "prête"', () => {
    const suivi = suiviRepas('en_route', PAYE);
    expect(suivi.etapes[suivi.indexCourant]?.label).toBe('En route vers vous');
    expect(suivi.termine).toBe(false);
  });

  it('says the order waits for its Mobile Money payment', () => {
    const suivi = suiviRepas('en_attente_acceptation', NON_PAYE);
    expect(suivi.ton).toBe('paiement');
    expect(suivi.indexCourant).toBe(0);
    expect(suivi.etapes[0]?.detail).toBe('En attente de votre paiement.');
  });

  it('hides the timeline of a refused order', () => {
    expect(suiviRepas('refusee', PAYE)).toMatchObject({ ton: 'echec', indexCourant: -1 });
  });
});

describe('suiviColis', () => {
  it('places the current step on the service status', () => {
    const suivi = suiviColis('colis_recupere', PAYE);
    expect(suivi.etapes[suivi.indexCourant]?.label).toBe('Colis récupéré');
  });

  it('treats a dispute as a closed, failed state', () => {
    expect(suiviColis('litige', PAYE)).toMatchObject({ ton: 'echec', indexCourant: -1 });
  });
});

describe('suiviCoursesExpress', () => {
  it('keeps etape_realisee on the "en cours" step', () => {
    const suivi = suiviCoursesExpress('etape_realisee', PAYE);
    expect(suivi.etapes[suivi.indexCourant]?.label).toBe('Course en cours');
  });
});
