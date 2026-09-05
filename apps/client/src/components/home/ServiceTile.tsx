import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ImageVariant } from '@/data/images';

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
 * entre les 4 services. Un seul visuel figé par service : sur l'écran de
 * choix, le mouvement est réservé à la commande en cours
 * (ActiveOrderBanner), la seule chose qui change vraiment.
 */
export function ServiceTile({
  to,
  label,
  description,
  slide,
  disabled = false,
}: {
  to: string;
  label: string;
  description: string;
  slide: TileSlide;
  disabled?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-(--duration-fast) ease-(--ease-signature) hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="absolute inset-0">
        {slide.image ? (
          <img
            src={slide.image.src}
            srcSet={slide.image.srcSet}
            sizes="(min-width: 640px) 280px, 50vw"
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          slide.illustration
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {disabled && (
        <span className="absolute top-2.5 right-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
          Indisponible
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="font-heading text-sm font-semibold text-white drop-shadow-sm">{label}</p>
        <p className="line-clamp-1 text-[11px] text-white/85">{description}</p>
      </div>
    </Link>
  );
}
