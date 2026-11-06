// Company the app is opened for (étape 6 of docs/plan-migration-multi-tenant.md):
// name, colours, contacts, town, commission and opened features, read from
// GET /api/tenant. Shared by the 4 apps; framework-free, each app wraps it
// in a React hook (src/lib/entreprise.ts).
//
// The API knows the company from the domain the app is served on (Origin).
// A `?entreprise=<slug>` URL parameter forces one (local development, tests
// on a shared domain): it is remembered and sent as X-Tenant.

import {
  CONTRE_REMBOURSEMENT_ACTIF,
  EMPLETTES_ACTIF,
  ESPECES_ACTIF,
  SERVICES_ACTIFS,
} from './perimetre-v1';

export interface Entreprise {
  slug: string;
  nomCommercial: string;
  /** Service fee on Repas, in percent. */
  tauxCommission: number;
  logoUrl: string | null;
  couleurPrimaire: string;
  couleurMarine: string;
  couleurSignal: string;
  telephoneContact: string | null;
  whatsappSupport: string | null;
  emailContact: string | null;
  ville: string;
  pays: string;
  devise: string;
  fuseauHoraire: string;
  indicatifTelephone: string;
  /** Opened by the company within the platform ceiling (service.repas…). */
  fonctionnalites: string[];
}

// CHAP EXPRESS as inserted by migration plateforme_tenants: what the apps
// show before the first answer of the API (first start offline) and on its
// historical domains. Colours are those of marque.css.
export const ENTREPRISE_PAR_DEFAUT: Entreprise = {
  slug: 'chapexpress',
  nomCommercial: 'ChapExpress',
  tauxCommission: 15,
  logoUrl: null,
  couleurPrimaire: '#1450d8',
  couleurMarine: '#0a2a66',
  couleurSignal: '#d7262e',
  telephoneContact: '+2290157866959',
  whatsappSupport: '+2290157866959',
  emailContact: 'contact@chapexpress.bj',
  ville: 'Natitingou',
  pays: 'BJ',
  devise: 'XOF',
  fuseauHoraire: 'Africa/Porto-Novo',
  indicatifTelephone: '+229',
  fonctionnalites: [
    ...SERVICES_ACTIFS.map((service) => `service.${service}`),
    ...(EMPLETTES_ACTIF ? ['service.emplettes'] : []),
    'paiement.mobile_money',
    ...(ESPECES_ACTIF ? ['paiement.especes'] : []),
    ...(CONTRE_REMBOURSEMENT_ACTIF ? ['colis.contre_remboursement'] : []),
  ],
};

const CLE_SLUG = 'rapidliv-entreprise';
const CLE_CACHE = 'rapidliv-entreprise-cache';

function stockage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null; // Private mode, blocked storage.
  }
}

/** Slug forced by `?entreprise=` (remembered), null when the domain decides. */
export function slugForce(): string | null {
  const store = stockage();
  if (typeof window !== 'undefined') {
    const parametre = new URLSearchParams(window.location.search).get('entreprise');
    if (parametre) {
      store?.setItem(CLE_SLUG, parametre);
      return parametre;
    }
  }
  return store?.getItem(CLE_SLUG) ?? null;
}

/** Headers of every API call: X-Tenant only when a company is forced. */
export function enTetesEntreprise(): Record<string, string> {
  const slug = slugForce();
  return slug ? { 'X-Tenant': slug } : {};
}

function lireCache(): Entreprise | null {
  try {
    const brut = stockage()?.getItem(CLE_CACHE);
    return brut ? ({ ...ENTREPRISE_PAR_DEFAUT, ...JSON.parse(brut) } as Entreprise) : null;
  } catch {
    return null;
  }
}

let courante: Entreprise = lireCache() ?? ENTREPRISE_PAR_DEFAUT;
const abonnes = new Set<() => void>();

export function entrepriseCourante(): Entreprise {
  return courante;
}

export function abonnerEntreprise(abonne: () => void): () => void {
  abonnes.add(abonne);
  return () => abonnes.delete(abonne);
}

function definir(entreprise: Entreprise) {
  courante = entreprise;
  appliquerCouleurs(entreprise);
  appliquerManifeste(entreprise);
  abonnes.forEach((abonne) => abonne());
}

export type ApplicationPwa = 'client' | 'livreur' | 'partenaires' | 'admin';

let pwa: { apiUrl: string; application: ApplicationPwa } | null = null;

/**
 * Installed name and icon of the app for its company (étape 10 of
 * docs/plan-migration-multi-tenant.md). CHAP EXPRESS keeps the manifest
 * built with the app, so its PWAs already installed do not change; any other
 * company gets the one the API builds from its settings.
 */
export function activerManifeste(apiUrl: string, application: ApplicationPwa): void {
  pwa = { apiUrl, application };
  appliquerManifeste(courante);
}

function appliquerManifeste(entreprise: Entreprise) {
  if (!pwa || typeof document === 'undefined') return;
  if (entreprise.slug === ENTREPRISE_PAR_DEFAUT.slug) return;
  const lien = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (lien) {
    lien.crossOrigin = 'anonymous';
    lien.href = `${pwa.apiUrl}/tenant/${encodeURIComponent(entreprise.slug)}/manifeste/${pwa.application}?origine=${encodeURIComponent(window.location.origin)}`;
  }
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', entreprise.couleurMarine);
}

/**
 * Brand colours as CSS variables. Only when they differ from CHAP EXPRESS:
 * its colours already come from marque.css, light and dark themes included,
 * and an inline value would override the dark theme.
 */
function appliquerCouleurs(entreprise: Entreprise) {
  if (typeof document === 'undefined') return;
  const style = document.documentElement.style;
  const variables: Array<[string, string, string]> = [
    ['--primary', entreprise.couleurPrimaire, ENTREPRISE_PAR_DEFAUT.couleurPrimaire],
    ['--ring', entreprise.couleurPrimaire, ENTREPRISE_PAR_DEFAUT.couleurPrimaire],
    ['--color-brand-blue', entreprise.couleurPrimaire, ENTREPRISE_PAR_DEFAUT.couleurPrimaire],
    ['--color-brand-navy', entreprise.couleurMarine, ENTREPRISE_PAR_DEFAUT.couleurMarine],
    ['--color-brand-red', entreprise.couleurSignal, ENTREPRISE_PAR_DEFAUT.couleurSignal],
  ];
  for (const [nom, valeur, defaut] of variables) {
    if (valeur.toLowerCase() === defaut.toLowerCase()) style.removeProperty(nom);
    else style.setProperty(nom, valeur);
  }
}

/** Loads the company from the API; keeps the cached one when offline. */
export async function chargerEntreprise(apiUrl: string): Promise<void> {
  appliquerCouleurs(courante);
  try {
    const reponse = await fetch(`${apiUrl}/tenant`, { headers: enTetesEntreprise() });
    if (!reponse.ok) return;
    const entreprise = (await reponse.json()) as Entreprise;
    stockage()?.setItem(CLE_CACHE, JSON.stringify(entreprise));
    definir(entreprise);
  } catch {
    // Offline or API asleep: the cached (or default) company stays.
  }
}

/** Feature code of a service route: '/courses-express' → 'service.courses_express'. */
export function codeService(route: string): string {
  return `service.${route.replace(/^\//, '').replace(/-/g, '_')}`;
}

/** Feature opened by the company (the compile-time ceiling still applies). */
export function estOuvert(entreprise: Entreprise, code: string): boolean {
  return entreprise.fonctionnalites.includes(code);
}

/**
 * Two-tone wordmark: a single word with an inner capital splits there
 * (ChapExpress → Chap + Express); any other name stays in one piece.
 */
export function decouperNom(nom: string): [string, string] {
  const morceaux = /^([A-Z][a-z]+)([A-Z]\S*)$/.exec(nom);
  const [, debut, fin] = morceaux ?? [];
  return debut && fin ? [debut, fin] : [nom, ''];
}

/**
 * Number in the local display format: +2290157866959 with indicatif +229
 * → "01 57 86 69 59".
 */
export function numeroLocal(entreprise: Entreprise, numero: string | null): string {
  if (!numero) return '';
  const chiffres = numero.replace(/\D/g, '');
  const indicatif = entreprise.indicatifTelephone.replace(/\D/g, '');
  const local = chiffres.startsWith(indicatif) ? chiffres.slice(indicatif.length) : chiffres;
  return local.replace(/(\d{2})(?=\d)/g, '$1 ');
}

/** wa.me link to the company's support, null without a number. */
export function lienWhatsAppSupport(entreprise: Entreprise, texte?: string): string | null {
  const numero = entreprise.whatsappSupport?.replace(/\D/g, '');
  if (!numero) return null;
  return `https://wa.me/${numero}${texte ? `?text=${encodeURIComponent(texte)}` : ''}`;
}
