// Régénère favicon/PWA icons avec la nouvelle identité (latérite + monogramme),
// à la place de l'ancien scooter bleu/vert. Usage ponctuel :
// `node scripts/generate-app-icons.mjs`.
import sharp from 'sharp';
import { join } from 'node:path';

const PUBLIC_DIR = join(import.meta.dirname, '../public');
const BG = '#002050'; // navy
const INK = '#FFFFFF';

function markSvg({ size, safeZone = 1 }) {
  const fontSize = Math.round(size * 0.56 * safeZone);
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${BG}" />
      <text
        x="50%" y="53%"
        text-anchor="middle" dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="${fontSize}"
        fill="${INK}"
      >C</text>
    </svg>`;
}

const targets = [
  { file: 'favicon.png', size: 64 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'pwa-192.png', size: 192 },
  { file: 'pwa-512.png', size: 512 },
  // maskable : contenu resserré dans la zone sûre (~80%) pour survivre au masque OS.
  { file: 'maskable-512.png', size: 512, safeZone: 0.72 },
];

for (const { file, size, safeZone } of targets) {
  await sharp(Buffer.from(markSvg({ size, safeZone })))
    .png()
    .toFile(join(PUBLIC_DIR, file));
  console.log(file);
}
