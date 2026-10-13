import { describe, expect, it } from 'vitest';
import type { CommandeRepas, StatutRepas } from '@/api/types';
import { bilan, cleJour, evolution, joursGlissants } from './ventes';

// 13 Oct 2026, 10:00 in Natitingou (UTC+1).
const MAINTENANT = Date.parse('2026-10-13T09:00:00Z');

function commande(statut: StatutRepas, createdAt: string, sousTotal: string, lignes: [string, number, string][]) {
  return {
    id: createdAt + statut,
    statut,
    createdAt,
    commande: { sousTotal },
    lignes: lignes.map(([platId, quantite, prixUnitaire]) => ({
      id: platId + createdAt,
      platId,
      quantite,
      prixUnitaire,
      plat: { id: platId, nom: platId.toUpperCase() },
    })),
  } as unknown as CommandeRepas;
}

describe('cleJour', () => {
  it('uses Benin time: 23:30 UTC is already the next day', () => {
    expect(cleJour('2026-10-12T23:30:00Z')).toBe('2026-10-13');
    expect(cleJour('2026-10-12T22:30:00Z')).toBe('2026-10-12');
  });
});

describe('joursGlissants', () => {
  it('lists the period oldest first, ending today', () => {
    expect(joursGlissants(3, MAINTENANT)).toEqual(['2026-10-11', '2026-10-12', '2026-10-13']);
  });
  it('shifts back for the previous period', () => {
    expect(joursGlissants(2, MAINTENANT, 2)).toEqual(['2026-10-10', '2026-10-11']);
  });
});

describe('bilan', () => {
  const commandes = [
    commande('livree', '2026-10-13T08:00:00Z', '3000', [['riz', 2, '1500']]),
    commande('en_route', '2026-10-13T08:30:00Z', '2500', [['riz', 1, '1500'], ['jus', 2, '500']]),
    commande('en_preparation', '2026-10-13T08:45:00Z', '9999', [['riz', 9, '1111']]),
    commande('refusee', '2026-10-13T07:00:00Z', '1000', [['jus', 2, '500']]),
    commande('livree', '2026-10-01T12:00:00Z', '8000', [['poulet', 1, '8000']]),
  ];

  it('counts only orders handed to the livreur, on the dishes amount', () => {
    const resultat = bilan(commandes, joursGlissants(1, MAINTENANT));
    expect(resultat.servies).toBe(2);
    expect(resultat.chiffreAffaires).toBe(5500);
    expect(resultat.panierMoyen).toBe(2750);
    expect(resultat.refusees).toBe(1);
    expect(resultat.parJour).toEqual([{ jour: '2026-10-13', montant: 5500, commandes: 2 }]);
  });

  it('ranks dishes by quantity sold', () => {
    const { topPlats } = bilan(commandes, joursGlissants(1, MAINTENANT));
    expect(topPlats).toEqual([
      { nom: 'RIZ', quantite: 3, montant: 4500 },
      { nom: 'JUS', quantite: 2, montant: 1000 },
    ]);
  });

  it('leaves out orders outside the period and has no average without sales', () => {
    expect(bilan(commandes, joursGlissants(30, MAINTENANT)).chiffreAffaires).toBe(13500);
    expect(bilan([], joursGlissants(7, MAINTENANT)).panierMoyen).toBeNull();
  });
});

describe('evolution', () => {
  it('gives the change in percent, null without a previous value', () => {
    expect(evolution(150, 100)).toBe(50);
    expect(evolution(50, 100)).toBe(-50);
    expect(evolution(10, 0)).toBeNull();
  });
});
