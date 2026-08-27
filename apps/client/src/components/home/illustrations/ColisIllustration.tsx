import { useId } from 'react';

/**
 * Illustration vectorielle originale (pas une photo) pour la tuile Colis —
 * aucune vraie photo n'existe pour ce service. Placeholder à remplacer par de
 * vraies photos partenaires quand le service sera livré (voir docs/perimetre.md).
 */
export function ColisIllustration({ variant }: { variant: 1 | 2 }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="presentation">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#002050" />
          <stop offset="100%" stopColor="#1070c0" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${gradientId})`} />
      {variant === 1 ? (
        <g>
          <rect x="130" y="120" width="140" height="110" rx="6" fill="#e8f1fb" />
          <path d="M130 120 L155 90 L245 90 L270 120 Z" fill="#ffffff" opacity="0.55" />
          <rect x="192" y="90" width="16" height="140" fill="#1070c0" />
          <rect x="130" y="168" width="140" height="16" fill="#1070c0" />
        </g>
      ) : (
        <g>
          <circle cx="150" cy="215" r="20" fill="#e8f1fb" />
          <circle cx="260" cy="215" r="20" fill="#e8f1fb" />
          <path
            d="M150 215 h60 l20 -55 h30"
            stroke="#e8f1fb"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="255" y="120" width="55" height="45" rx="6" fill="#ffffff" opacity="0.85" />
          <line x1="55" y1="150" x2="105" y2="150" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
          <line x1="45" y1="175" x2="95" y2="175" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
        </g>
      )}
    </svg>
  );
}
