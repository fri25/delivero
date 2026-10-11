// The 8 cuisine types used as catalogue filters (F-CLI-11). Real data, not
// placeholder: see docs/annexe-a-catalogue-lancement.md §A.2.
// Mirrored in apps/api/src/restaurants/types-cuisine.ts (the API does not
// import this package) — keep both lists identical.
export const TYPES_CUISINE = [
  'Cuisine locale',
  'Grillades',
  'Fast-food',
  'Pizza',
  'Sandwichs & chawarma',
  'Petit-déjeuner',
  'Café & boissons',
  'Pâtisserie',
] as const;

export type TypeCuisine = (typeof TYPES_CUISINE)[number];
