// Delivery pricing by neighbourhood (Q-28, decided 13/10/2026 — see
// docs/regles-gestion.md RG-08). Pure functions: the services fetch the
// neighbourhoods, these say what they cost.

/** Repas delivery fee and Colis price: the fee of the delivery neighbourhood. */
export function tarifQuartier(fraisLivraison: number): number {
  return Math.round(fraisLivraison);
}

/**
 * Course express: the dearest neighbourhood among the stops, once per stop
 * (rule chosen on 13/10: "le prix du quartier le plus cher parmi les arrêts,
 * par arrêt").
 */
export function tarifCoursesExpress(fraisParArret: number[]): number {
  if (fraisParArret.length === 0) {
    throw new Error('Une course a au moins un arrêt.');
  }
  return Math.round(Math.max(...fraisParArret)) * fraisParArret.length;
}
