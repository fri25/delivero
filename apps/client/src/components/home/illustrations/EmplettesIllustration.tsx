import { useId } from 'react';

/**
 * Illustration vectorielle originale (pas une photo) pour la tuile Emplettes
 * — aucune vraie photo n'existe pour ce service. Placeholder à remplacer par
 * de vraies photos quand le service sera livré (voir docs/perimetre.md).
 */
export function EmplettesIllustration({ variant }: { variant: 1 | 2 }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="presentation">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b3d77" />
          <stop offset="100%" stopColor="#1070c0" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${gradientId})`} />
      {variant === 1 ? (
        <g>
          <path d="M140 150 L260 150 L245 235 Q200 250 155 235 Z" fill="#e8f1fb" />
          <path
            d="M155 150 L165 110 M245 150 L235 110"
            stroke="#e8f1fb"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="175" cy="175" r="14" fill="#1070c0" />
          <circle cx="205" cy="180" r="16" fill="#2e8fe0" />
          <circle cx="230" cy="172" r="12" fill="#1070c0" />
        </g>
      ) : (
        <g>
          <rect x="150" y="90" width="100" height="140" rx="8" fill="#ffffff" opacity="0.9" />
          <line x1="168" y1="120" x2="232" y2="120" stroke="#0b3d77" strokeWidth="6" strokeLinecap="round" />
          <line x1="168" y1="145" x2="232" y2="145" stroke="#0b3d77" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
          <line x1="168" y1="170" x2="215" y2="170" stroke="#0b3d77" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
          <path
            d="M168 200 l10 10 l20 -22"
            fill="none"
            stroke="#1070c0"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}
