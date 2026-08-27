import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { ImageVariant } from '@/data/images';

const SLIDE_INTERVAL_MS = 4500;

export interface TileSlide {
  /** Vraie photo (catalogue de démo ou API). */
  image?: ImageVariant;
  /** Illustration vectorielle de repli quand aucune vraie photo n'existe. */
  illustration?: ReactNode;
}

/**
 * Tuile de service du hub d'accueil : même gabarit (ratio, overlay dégradé,
 * libellé + description en bas) que le service ait une vraie photo (Repas) ou
 * une illustration (services pas encore lancés) — traitement visuel égal
 * entre les 4 services. Fait défiler plusieurs slides en fondu si `slides`
 * en contient plus d'une ; respecte prefers-reduced-motion (pas de défilement
 * auto) et se met en pause quand l'onglet n'est pas visible.
 */
export function ServiceTile({
  to,
  label,
  description,
  slides,
  disabled = false,
}: {
  to: string;
  label: string;
  description: string;
  slides: TileSlide[];
  disabled?: boolean;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setIndex((i) => (i + 1) % slides.length);
      }
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <Link
      to={to}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-(--duration-fast) ease-(--ease-signature) hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== index}
          className={cn(
            'absolute inset-0 transition-opacity duration-(--duration-slow) ease-(--ease-signature)',
            i === index ? 'opacity-100' : 'opacity-0',
          )}
        >
          {slide.image ? (
            <img
              src={slide.image.src}
              srcSet={slide.image.srcSet}
              sizes="(min-width: 640px) 280px, 50vw"
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            slide.illustration
          )}
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {disabled && (
        <span className="absolute top-2.5 right-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
          Indisponible
        </span>
      )}

      {slides.length > 1 && (
        <div className="absolute top-2.5 left-2.5 flex gap-1">
          {slides.map((_, i) => (
            <span key={i} className={cn('h-1 w-3 rounded-full bg-white', i === index ? 'opacity-90' : 'opacity-35')} />
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="font-heading text-sm font-semibold text-white drop-shadow-sm">{label}</p>
        <p className="line-clamp-1 text-[11px] text-white/85">{description}</p>
      </div>
    </Link>
  );
}
