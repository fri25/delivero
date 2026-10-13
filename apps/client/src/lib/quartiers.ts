import type { Quartier } from '@/api/types';

/** What QuartierField edits: the priced neighbourhood + typed name for "Autre". */
export interface ChoixQuartier {
  quartierId: string;
  /** Name typed when "Autre quartier" is picked; ignored otherwise. */
  precision: string;
}

export const CHOIX_QUARTIER_VIDE: ChoixQuartier = { quartierId: '', precision: '' };

export function quartierChoisi(value: ChoixQuartier, quartiers: Quartier[] | undefined): Quartier | undefined {
  return quartiers?.find((quartier) => quartier.id === value.quartierId);
}

/** True when the choice is complete (a neighbourhood, and its name if "Autre"). */
export function choixQuartierComplet(value: ChoixQuartier, quartiers: Quartier[] | undefined): boolean {
  const choisi = quartierChoisi(value, quartiers);
  return Boolean(choisi && (!choisi.autre || value.precision.trim()));
}

/** Fields the API expects next to a neighbourhood id. */
export function versApi(value: ChoixQuartier): { quartierId: string; quartier?: string } {
  return { quartierId: value.quartierId, quartier: value.precision.trim() || undefined };
}

/**
 * Courses express price: the dearest stop neighbourhood × number of stops
 * (mirror of apps/api/src/quartiers/tarification.ts, for the live estimate).
 */
export function tarifCoursesExpress(frais: number[]): number | undefined {
  if (frais.length === 0) return undefined;
  return Math.round(Math.max(...frais)) * frais.length;
}

/** "500 à 1 000 FCFA" range shown before the client picks a neighbourhood. */
export function fourchetteFrais(quartiers: Quartier[] | undefined): { min: number; max: number } | undefined {
  if (!quartiers?.length) return undefined;
  const frais = quartiers.map((quartier) => Number(quartier.fraisLivraison));
  return { min: Math.min(...frais), max: Math.max(...frais) };
}
