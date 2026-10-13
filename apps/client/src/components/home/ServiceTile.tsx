import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ImageVariant } from '@/data/images';
import { cn } from '@/lib/utils';

export interface TileSlide {
  /** Vraie photo (catalogue de démo ou API). */
  image?: ImageVariant;
  /** Recadrage large de la même photo, servi à partir de lg (PC). */
  imageLarge?: ImageVariant;
  /** Illustration vectorielle de repli quand aucune vraie photo n'existe. */
  illustration?: ReactNode;
}

/**
 * Carte photo de service du hub d'accueil, même traitement pour tous les
 * services : photo, dégradé, libellé + description + action en blanc. Le
 * libellé est une action (« Envoyer un colis ») et la description dit
 * concrètement ce que fait le livreur.
 *
 * - `vedette` : grande carte + bandeau d'action (Repas, le service phare).
 * - sinon : carte plus compacte (deux par ligne sur mobile, empilées à côté
 *   de la vedette sur PC, où elles remplissent la hauteur de leur cellule).
 */
export function ServiceTile({
  to,
  label,
  description,
  action,
  slide,
  vedette = false,
  className,
}: {
  to: string;
  label: string;
  description: string;
  action: string;
  slide: TileSlide;
  vedette?: boolean;
  className?: string;
}) {
  const visuel = slide.image ? (
    <picture>
      {slide.imageLarge && (
        <source media="(min-width: 1024px)" srcSet={slide.imageLarge.srcSet} sizes="440px" />
      )}
      <img
        src={slide.image.src}
        srcSet={slide.image.srcSet}
        sizes={vedette ? '(min-width: 1024px) 680px, (min-width: 640px) 600px, 100vw' : '50vw'}
        alt=""
        // The hero is the LCP element of the home page: fetch it first; the
        // smaller cards below wait their turn (budget: LCP ≤ 3 s on 3G).
        loading={vedette ? 'eager' : 'lazy'}
        fetchPriority={vedette ? 'high' : 'low'}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-(--duration-slow) ease-(--ease-signature) group-hover:scale-[1.03]"
      />
    </picture>
  ) : (
    <div className="absolute inset-0">{slide.illustration}</div>
  );

  if (vedette) {
    return (
      <Link
        to={to}
        className={cn(
          'group block overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10 transition-shadow duration-(--duration-fast) ease-(--ease-signature) hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:flex lg:flex-col',
          className,
        )}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-muted lg:aspect-auto lg:min-h-[26rem] lg:flex-1">
          {visuel}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5">
            <h3 className="font-heading text-2xl font-semibold text-white drop-shadow-sm lg:text-3xl">{label}</h3>
            <p className="mt-0.5 text-sm text-white/90 lg:text-base">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-4">
          <span className="text-sm font-semibold text-primary">{action}</span>
          <ArrowRight
            className="size-5 text-primary transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        'group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10 transition-shadow duration-(--duration-fast) ease-(--ease-signature) hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:aspect-[4/3] lg:aspect-auto lg:min-h-48 lg:rounded-3xl',
        className,
      )}
    >
      {visuel}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent lg:from-black/90 lg:via-black/25" />
      <div className="absolute inset-x-0 bottom-0 p-3 lg:p-5">
        <h3 className="font-heading text-lg leading-tight font-semibold text-white drop-shadow-sm lg:text-2xl">
          {label}
        </h3>
        <p className="mt-1 line-clamp-3 text-xs leading-snug text-white/90 sm:text-sm lg:line-clamp-2">{description}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-white">
          {action}
          <ArrowRight
            className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
