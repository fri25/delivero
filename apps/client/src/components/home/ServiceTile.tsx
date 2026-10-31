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
 * Carte de service du hub d'accueil : photo nette en haut (aucun voile
 * sombre), texte sur fond blanc en dessous, flèche bleue. Le badge rouge est
 * réservé à un seul service mis en avant.
 */
export function ServiceTile({
  to,
  label,
  description,
  slide,
  badge,
  large = false,
  priority = false,
  className,
}: {
  to: string;
  label: string;
  description: string;
  slide: TileSlide;
  badge?: string;
  /** Spans the two mobile columns: wider photo crop. */
  large?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-border transition-[box-shadow,transform] duration-(--duration-fast) ease-(--ease-signature) hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className,
      )}
    >
      <div className={cn('relative overflow-hidden bg-secondary', large ? 'aspect-[2/1] lg:aspect-[4/3]' : 'aspect-[4/3]')}>
        {slide.image ? (
          <picture>
            {slide.imageLarge && (
              <source media="(min-width: 1024px)" srcSet={slide.imageLarge.srcSet} sizes="300px" />
            )}
            <img
              src={slide.image.src}
              srcSet={slide.image.srcSet}
              sizes={large ? '(min-width: 1024px) 300px, 100vw' : '(min-width: 1024px) 300px, 50vw'}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'low'}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-(--duration-slow) ease-out group-hover:scale-105"
            />
          </picture>
        ) : (
          <div className="absolute inset-0">{slide.illustration}</div>
        )}
        {badge && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-brand-red px-2.5 py-0.5 text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 items-end justify-between gap-2 p-3.5 sm:p-4">
        <div className="min-w-0">
          <h3 className="font-heading text-base font-bold leading-tight text-foreground sm:text-lg">{label}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground sm:text-sm">{description}</p>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-colors duration-(--duration-fast) group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
