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
 * Carte visuelle de service du hub d'accueil, avec dégradé moderne,
 * typographie soignée et micro-interactions au survol.
 */
export function ServiceTile({
  to,
  label,
  description,
  action,
  slide,
  vedette = false,
  badge,
  className,
}: {
  to: string;
  label: string;
  description: string;
  action: string;
  slide: TileSlide;
  vedette?: boolean;
  badge?: string;
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
        loading={vedette ? 'eager' : 'lazy'}
        fetchPriority={vedette ? 'high' : 'low'}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
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
          'group relative block overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-brand-blue/10 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:flex lg:flex-col',
          className,
        )}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-muted lg:aspect-auto lg:min-h-[26rem] lg:flex-1">
          {visuel}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

          {badge && (
            <span className="absolute top-3.5 left-3.5 md:top-4 md:left-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md ring-1 ring-white/30 shadow-xs">
              {badge}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 text-white">
            <h3 className="font-heading text-2xl font-bold tracking-tight text-white drop-shadow-md lg:text-3xl">
              {label}
            </h3>
            <p className="mt-1 text-sm text-white/90 drop-shadow-sm lg:text-base max-w-md">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-card px-4 py-3.5 md:px-6 md:py-4 border-t border-border/50">
          <span className="text-sm font-semibold text-brand-blue group-hover:underline">
            {action}
          </span>
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-brand-blue group-hover:text-white">
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        'group relative block aspect-[4/5] overflow-hidden rounded-2xl md:rounded-3xl bg-muted ring-1 ring-foreground/10 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-brand-blue/10 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:aspect-[4/3] lg:aspect-auto lg:min-h-52',
        className,
      )}
    >
      {visuel}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15 transition-opacity group-hover:opacity-95" />

      {badge && (
        <span className="absolute top-3 left-3 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md ring-1 ring-white/30 shadow-xs">
          {badge}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-5">
        <h3 className="font-heading text-lg font-bold leading-tight text-white drop-shadow-sm sm:text-xl lg:text-2xl">
          {label}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/85 sm:text-sm">
          {description}
        </p>
        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md ring-1 ring-white/30 transition-all duration-300 group-hover:bg-white group-hover:text-brand-navy">
          <span>{action}</span>
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
