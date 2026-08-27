import { useId } from 'react';

/**
 * Illustration vectorielle originale (pas une photo) pour la tuile Courses
 * express — aucune vraie photo n'existe pour ce service. Placeholder à
 * remplacer par de vraies photos quand le service sera livré (voir
 * docs/perimetre.md).
 */
export function CoursesExpressIllustration({ variant }: { variant: 1 | 2 }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="presentation">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1070c0" />
          <stop offset="100%" stopColor="#2e8fe0" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${gradientId})`} />
      {variant === 1 ? (
        <path d="M215 70 L150 175 L195 175 L180 235 L255 130 L205 130 Z" fill="#ffffff" opacity="0.9" />
      ) : (
        <g fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round">
          <path d="M90 220 Q200 100 310 200" strokeDasharray="2 16" opacity="0.7" />
          <circle cx="90" cy="220" r="14" fill="#ffffff" stroke="none" />
          <circle cx="310" cy="200" r="14" fill="#ffffff" stroke="none" />
        </g>
      )}
    </svg>
  );
}
