import { describe, expect, it } from 'vitest';
import type { RestaurantSummary } from '@/api/types';
import { FILTRES_VIDES, filtrerRestaurants, filtresActifs } from './filtres-catalogue';

const resto = (r: Partial<RestaurantSummary> & { id: string }): RestaurantSummary => ({
  nom: r.id,
  description: null,
  horaires: null,
  noteMoyenne: null,
  statutOuverture: true,
  typesCuisine: [],
  delaiPreparationMin: null,
  prixMoyen: null,
  ...r,
});

const CATALOGUE = [
  resto({ id: 'grill', typesCuisine: ['Grillades'], prixMoyen: 3500, noteMoyenne: '4.50', delaiPreparationMin: 30 }),
  resto({ id: 'cafe', typesCuisine: ['Café & boissons'], prixMoyen: 900, noteMoyenne: '3.80', delaiPreparationMin: 12 }),
  resto({ id: 'ferme', typesCuisine: ['Grillades'], prixMoyen: 2000, statutOuverture: false }),
  resto({ id: 'nouveau' }),
];

const ids = (liste: RestaurantSummary[]) => liste.map((r) => r.id);

describe('filtrerRestaurants', () => {
  it('returns everything without filters', () => {
    expect(ids(filtrerRestaurants(CATALOGUE, FILTRES_VIDES))).toEqual(['grill', 'cafe', 'ferme', 'nouveau']);
    expect(filtresActifs(FILTRES_VIDES)).toBe(false);
  });

  it('filters by cuisine type', () => {
    expect(ids(filtrerRestaurants(CATALOGUE, { ...FILTRES_VIDES, cuisine: 'Grillades' }))).toEqual(['grill', 'ferme']);
  });

  it('filters by price band on the average dish price', () => {
    expect(ids(filtrerRestaurants(CATALOGUE, { ...FILTRES_VIDES, prix: 'economique' }))).toEqual(['cafe']);
    expect(ids(filtrerRestaurants(CATALOGUE, { ...FILTRES_VIDES, prix: 'moyen' }))).toEqual(['ferme']);
    expect(ids(filtrerRestaurants(CATALOGUE, { ...FILTRES_VIDES, prix: 'eleve' }))).toEqual(['grill']);
  });

  it('excludes restaurants without the data a filter needs', () => {
    expect(ids(filtrerRestaurants(CATALOGUE, { ...FILTRES_VIDES, bienNotes: true }))).toEqual(['grill']);
    expect(ids(filtrerRestaurants(CATALOGUE, { ...FILTRES_VIDES, rapides: true }))).toEqual(['cafe']);
  });

  it('combines filters', () => {
    const filtres = { ...FILTRES_VIDES, ouvertsSeulement: true, cuisine: 'Grillades' as const };
    expect(ids(filtrerRestaurants(CATALOGUE, filtres))).toEqual(['grill']);
    expect(filtresActifs(filtres)).toBe(true);
  });
});
