/**
 * Photos de démo — restaurants et plats du catalogue pilote (annexe A).
 * Aucune vraie photo n'existe encore côté partenaires ; ce fichier est le
 * point unique à modifier pour brancher de vraies photos plus tard (une
 * ligne par plat/restaurant dans les tables ci-dessous).
 *
 * Les fichiers sources (22 photos) ne couvrent pas les 64 lignes du menu ni
 * les 7 restaurants : plusieurs plats de la même famille partagent la même
 * photo par défaut. Voir docs/annexe-a-catalogue-lancement.md pour le detail
 * du catalogue.
 */

type Shape = 'square' | 'wide';

const rawModules = import.meta.glob('../assets/demo/optimized/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export interface ImageVariant {
  src: string;
  srcSet: string;
}

interface RawVariant {
  width: number;
  url: string;
}

const bySource: Record<string, Record<Shape, RawVariant[]>> = {};

for (const [path, url] of Object.entries(rawModules)) {
  const file = path.split('/').pop() ?? '';
  const match = /^(.+)-(sq|wide)-(\d+)\.webp$/.exec(file);
  if (!match) continue;
  const [, name, shapeCode, widthStr] = match;
  if (!name || !shapeCode || !widthStr) continue;
  const shape: Shape = shapeCode === 'sq' ? 'square' : 'wide';
  bySource[name] ??= { square: [], wide: [] };
  bySource[name][shape].push({ width: Number(widthStr), url });
}

function toVariant(entries: RawVariant[]): ImageVariant | undefined {
  if (entries.length === 0) return undefined;
  const sorted = [...entries].sort((a, b) => a.width - b.width);
  return {
    src: sorted[sorted.length - 1]!.url,
    srcSet: sorted.map((entry) => `${entry.url} ${entry.width}w`).join(', '),
  };
}

interface DemoImage {
  square?: ImageVariant;
  wide?: ImageVariant;
}

const IMAGES: Record<string, DemoImage> = Object.fromEntries(
  Object.entries(bySource).map(([name, shapes]) => [
    name,
    { square: toVariant(shapes.square), wide: toVariant(shapes.wide) },
  ]),
);

/** Restaurant (nom exact) → photo héros (carte liste + en-tête fiche, 3:2). */
const RESTAURANT_IMAGE_BY_NOM: Record<string, string> = {
  'Chez Guillaume': 'cake',
  'Okoti Saveurs': 'agouti',
  'John Café': 'sandwich',
  'Le Bélier': 'piron',
  'Mini Kota': 'poisson-braise',
  "Jardin de l'Atacora": 'attassi',
  "Les Délices d'Angèle": 'panini',
};

/** Plat (nom exact) → photo carrée. */
const PLAT_IMAGE_BY_NOM: Record<string, string> = {
  // Chez Guillaume
  Croissant: 'cake',
  'Pain au chocolat': 'cake',
  'Gâteau à la part': 'gateau',
  'Beignets sucrés (x5)': 'cake',
  'Cake maison': 'cake',
  'Gâteau d\'anniversaire sur commande': 'gateau',
  'Jus locaux (bissap / gingembre)': 'bissap',

  // Okoti Saveurs
  'Agouti braisé': 'agouti',
  'Biche sauce arachide': 'agouti',
  'Pintade braisée': 'agouti',
  'Lapin sauce tomate': 'amiwo',
  'Riz (accompagnement)': 'riz',
  'Igname pilée (accompagnement)': 'piron',
  'Pâte rouge (accompagnement)': 'amiwo',
  'Frites (accompagnement)': 'frite',
  'Supplément piment': 'frite',
  'Supplément akpan': 'degue',
  Frites: 'frite',

  // John Café
  'Café moringa': 'cafe-moringa',
  'Thé moringa-citron': 'cafe-moringa',
  'Café au lait': 'cafe-moringa',
  'Chocolat chaud': 'cafe-moringa',
  'Formule petit-déjeuner complet': 'image',
  'Sandwich thon': 'sandwich',
  'Sandwich poulet': 'sandwich',
  'Croque-monsieur': 'panini',
  'Smoothie moringa-ananas': 'degue',

  // Le Bélier
  'Igname pilée sauce arachide + fromage peul': 'piron',
  'Tête de mouton façon Bélier': 'agouti',
  'Pâte noire sauce légume': 'telibo',
  'Pizza margherita': 'pizza',
  'Pizza poulet': 'pizza',
  'Pizza complète': 'pizza',
  'Chawarma poulet': 'schawarma',
  'Chawarma viande': 'schawarma',
  Boissons: 'bissap',

  // Mini Kota
  'Demi-poulet braisé': 'riz',
  'Poulet entier braisé': 'riz',
  'Poisson tilapia braisé': 'poisson-braise',
  'Brochettes de bœuf (x3)': 'agouti',
  Attiéké: 'atcheke-alloco',
  Alloco: 'alloco',
  'Salade fraîche': 'atcheke-alloco',

  // Jardin de l'Atacora
  'Poulet DG': 'riz',
  'Riz sauté aux crevettes': 'attassi',
  'Spaghetti bolognaise': 'spaghetti',
  'Steak-frites': 'frite',
  'Poisson braisé complet': 'com',
  'Igname frite + viande': 'piron',
  'Plat du jour': 'attassi',
  'Salade composée': 'atcheke-alloco',
  'Jus naturels': 'bissap',

  // Les Délices d'Angèle
  'Riz sauce tomate + viande': 'riz',
  'Riz gras': 'riz',
  'Spaghetti sauce viande': 'spaghetti',
  'Spaghetti aux œufs': 'spaghetti',
  'Panini poulet': 'panini',
  'Panini fromage': 'panini',
};

export function getRestaurantImage(nom: string): ImageVariant | undefined {
  const key = RESTAURANT_IMAGE_BY_NOM[nom.trim()];
  return key ? IMAGES[key]?.wide : undefined;
}

export function getPlatImage(nom: string): ImageVariant | undefined {
  const key = PLAT_IMAGE_BY_NOM[nom.trim()];
  return key ? IMAGES[key]?.square : undefined;
}
