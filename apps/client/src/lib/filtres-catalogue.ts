import type { TypeCuisine } from '@delivero/config/types-cuisine';
import type { RestaurantSummary } from '@/api/types';

export type TranchePrix = 'economique' | 'moyen' | 'eleve';

// [DÉDUIT] Price bands on the menu's average dish price (FCFA), computed by
// the API (`prixMoyen`). No band is defined in the specs: adjust here.
export const TRANCHES_PRIX: Record<TranchePrix, { label: string; min: number; max: number }> = {
  economique: { label: 'Moins de 1 500 F', min: 0, max: 1500 },
  moyen: { label: '1 500 – 3 000 F', min: 1501, max: 3000 },
  eleve: { label: 'Plus de 3 000 F', min: 3001, max: Number.POSITIVE_INFINITY },
};

export const NOTE_MIN = 4;
export const DELAI_MAX_MIN = 20;

export interface FiltresCatalogue {
  ouvertsSeulement: boolean;
  cuisine: TypeCuisine | null;
  prix: TranchePrix | null;
  bienNotes: boolean;
  rapides: boolean;
}

export const FILTRES_VIDES: FiltresCatalogue = {
  ouvertsSeulement: false,
  cuisine: null,
  prix: null,
  bienNotes: false,
  rapides: false,
};

export function filtresActifs(filtres: FiltresCatalogue): boolean {
  return (
    filtres.ouvertsSeulement || filtres.cuisine !== null || filtres.prix !== null || filtres.bienNotes || filtres.rapides
  );
}

/**
 * A restaurant missing the filtered data (no rating yet, no preparation time,
 * no priced dish) is excluded by that filter: showing it would contradict
 * what the client asked for.
 */
export function filtrerRestaurants(restaurants: RestaurantSummary[], filtres: FiltresCatalogue): RestaurantSummary[] {
  return restaurants.filter((restaurant) => {
    if (filtres.ouvertsSeulement && !restaurant.statutOuverture) return false;
    if (filtres.cuisine && !restaurant.typesCuisine.includes(filtres.cuisine)) return false;
    if (filtres.prix) {
      const tranche = TRANCHES_PRIX[filtres.prix];
      if (restaurant.prixMoyen === null || restaurant.prixMoyen < tranche.min || restaurant.prixMoyen > tranche.max) {
        return false;
      }
    }
    if (filtres.bienNotes && (restaurant.noteMoyenne === null || Number(restaurant.noteMoyenne) < NOTE_MIN)) {
      return false;
    }
    if (
      filtres.rapides &&
      (restaurant.delaiPreparationMin === null || restaurant.delaiPreparationMin > DELAI_MAX_MIN)
    ) {
      return false;
    }
    return true;
  });
}
