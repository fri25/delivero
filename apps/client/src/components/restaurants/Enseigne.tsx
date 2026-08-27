import { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Enseigne peinte à la main — remplace la photo manquante d'un restaurant ou
 * d'un plat. Couleur dérivée du nom (deux restaurants sans photo n'auront
 * jamais le même rendu), nom traité typographiquement, grain superposé pour
 * évoquer une devanture plutôt qu'un placeholder générique.
 */

const PALETTE = [
  { bg: '#002050', ink: '#EAF1FB' }, // navy
  { bg: '#1070C0', ink: '#FFFFFF' }, // bleu
  { bg: '#0B3D77', ink: '#EAF1FB' }, // bleu profond
  { bg: '#2E8FE0', ink: '#052038' }, // bleu ciel
  { bg: '#163A6B', ink: '#EAF1FB' }, // bleu indigo
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function initials(nom: string): string {
  const words = nom.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return '?';
  if (words.length === 1) return first.slice(0, 2).toUpperCase();
  const second = words[1]!;
  return (first[0]! + second[0]!).toUpperCase();
}

export function Enseigne({ nom, className }: { nom: string; className?: string }) {
  const filterId = useId();
  const { bg, ink, label } = useMemo(() => {
    const hash = hashString(nom);
    const color = PALETTE[hash % PALETTE.length]!;
    return { ...color, label: initials(nom) };
  }, [nom]);

  return (
    <div
      role="img"
      aria-label={nom}
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden [container-type:inline-size]',
        className,
      )}
      style={{
        background: `radial-gradient(120% 140% at 25% 20%, color-mix(in oklab, ${bg}, white 12%), ${bg} 70%)`,
      }}
    >
      <span
        aria-hidden
        className="font-heading select-none text-[clamp(1.1rem,26cqw,3.75rem)] leading-none font-semibold tracking-tight opacity-95"
        style={{ color: ink }}
      >
        {label}
      </span>
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15] mix-blend-overlay" aria-hidden>
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
    </div>
  );
}
