import { TypeService } from '@prisma/client';
import {
  bornesPeriode,
  calculerStatistiques,
  cleJourBenin,
  debutJourBenin,
  type LigneStatistique,
} from './statistiques';

// 13 Oct 2026, 10:00 in Natitingou (09:00 UTC).
const MAINTENANT = Date.parse('2026-10-13T09:00:00Z');
const MIN = 60_000;

function ligne(partiel: Partial<LigneStatistique>): LigneStatistique {
  const createdAt = partiel.createdAt ?? MAINTENANT - 60 * MIN;
  return {
    typeService: TypeService.repas,
    createdAt,
    majAt: createdAt + 40 * MIN,
    issue: 'terminee',
    montantTotal: 3000,
    sousTotal: 2000,
    restaurant: { id: 'r1', nom: 'Le Baobab' },
    livreur: { id: 'l1', nom: 'Koffi' },
    ...partiel,
  };
}

describe('Benin days', () => {
  it('starts at 23:00 UTC the day before', () => {
    expect(new Date(debutJourBenin(MAINTENANT)).toISOString()).toBe(
      '2026-10-12T23:00:00.000Z',
    );
    expect(cleJourBenin(Date.parse('2026-10-12T23:30:00Z'))).toBe('2026-10-13');
  });

  it('gives the period and the one before', () => {
    const bornes = bornesPeriode('7j', MAINTENANT);
    expect(new Date(bornes.debut).toISOString()).toBe(
      '2026-10-06T23:00:00.000Z',
    );
    expect(bornes.debut - bornes.debutPrecedent).toBe(7 * 24 * 60 * MIN);
  });
});

describe('calculerStatistiques', () => {
  const hier = MAINTENANT - 24 * 60 * MIN;
  const lignes = [
    ligne({}),
    ligne({ montantTotal: 1000, majAt: MAINTENANT - 40 * MIN }),
    ligne({ issue: 'annulee', montantTotal: 9999 }),
    ligne({
      typeService: TypeService.colis,
      issue: 'en_cours',
      sousTotal: null,
      restaurant: null,
    }),
    ligne({ createdAt: hier }),
  ];
  const stats = calculerStatistiques(lignes, bornesPeriode('jour', MAINTENANT));

  it('sums terminated orders only', () => {
    expect(stats.actuel).toMatchObject({
      demandes: 4,
      terminees: 2,
      annulees: 1,
      enCours: 1,
      montantTermine: 4000,
      panierMoyen: 2000,
      tauxAnnulation: 25,
      delaiMoyenMinutes: 30,
    });
    expect(stats.precedent.demandes).toBe(1);
  });

  it('splits by service and by day', () => {
    expect(stats.parService.map((s) => [s.typeService, s.demandes])).toEqual([
      ['repas', 3],
      ['colis', 1],
    ]);
    expect(stats.parJour).toEqual([{ jour: '2026-10-13', demandes: 4 }]);
  });

  it('ranks restaurants on dishes sold and livreurs on deliveries', () => {
    expect(stats.restaurants).toEqual([
      { id: 'r1', nom: 'Le Baobab', terminees: 2, montant: 4000 },
    ]);
    expect(stats.livreurs[0]).toMatchObject({ id: 'l1', terminees: 2 });
  });

  it('has no averages without data', () => {
    const vide = calculerStatistiques([], bornesPeriode('30j', MAINTENANT));
    expect(vide.actuel.panierMoyen).toBeNull();
    expect(vide.actuel.tauxAnnulation).toBeNull();
    expect(vide.parJour).toHaveLength(30);
  });
});
