// Compresse les photos de démo (assets/demo/*.jpg) en WebP, recadrées aux
// ratios réellement utilisés à l'affichage (carré pour les plats, 3:2 pour
// les en-têtes restaurant), deux largeurs pour le srcset responsive.
// Usage ponctuel : `node scripts/optimize-demo-images.mjs`.
import sharp from 'sharp';
import { readdirSync, mkdirSync, rmSync } from 'node:fs';
import { join, parse } from 'node:path';

const SRC_DIR = join(import.meta.dirname, '../src/assets/demo');
const OUT_DIR = join(SRC_DIR, 'optimized');

// Les 7 photos retenues comme héros de fiche/carte restaurant ont en plus
// besoin d'un recadrage large 3:2 (les 22 photos servent toutes de photo de
// plat, en carré).
const HERO_SOURCES = ['cake', 'agouti', 'sandwich', 'piron', 'poisson-braise', 'attassi', 'panini'];

const SQUARE_WIDTHS = [420, 760];
const WIDE_WIDTHS = [480, 900];

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(SRC_DIR).filter((f) => f.toLowerCase().endsWith('.jpg'));

for (const file of files) {
  const { name } = parse(file);
  const input = join(SRC_DIR, file);

  for (const width of SQUARE_WIDTHS) {
    await sharp(input)
      .resize({ width, height: width, fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 68 })
      .toFile(join(OUT_DIR, `${name}-sq-${width}.webp`));
  }

  if (HERO_SOURCES.includes(name)) {
    for (const width of WIDE_WIDTHS) {
      const height = Math.round((width * 2) / 3);
      await sharp(input)
        .resize({ width, height, fit: 'cover', position: sharp.strategy.attention })
        .webp({ quality: 68 })
        .toFile(join(OUT_DIR, `${name}-wide-${width}.webp`));
    }
  }

  console.log(name);
}
