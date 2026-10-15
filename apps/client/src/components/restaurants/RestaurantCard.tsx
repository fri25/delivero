import { Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { getRestaurantImage } from '@/data/images';
import type { RestaurantSummary } from '@/api/types';
import { formatPrixFcfa } from '@/lib/format';

export function RestaurantCard({
  restaurant,
  index = 0,
  priority = false,
}: {
  restaurant: RestaurantSummary;
  index?: number;
  priority?: boolean;
}) {
  const image = restaurant.imageUrl ?? getRestaurantImage(restaurant.nom);
  const ouvert = restaurant.statutOuverture;

  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="group fill-mode-both animate-in slide-in-from-bottom-3 fade-in-0 block duration-(--duration-base) ease-(--ease-signature) focus-visible:outline-none"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <article className="overflow-hidden rounded-3xl bg-card border border-border/70 shadow-xs transition-all duration-300 ease-(--ease-signature) group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:border-primary/25 group-active:translate-y-0 group-active:shadow-none group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="relative overflow-hidden">
          <MediaFrame
            nom={restaurant.nom}
            image={image}
            ratio="wide"
            priority={priority}
            vignette
            className={ouvert ? 'transition-transform duration-500 ease-out group-hover:scale-105' : 'grayscale-[55%]'}
          >
            <div className="absolute top-3 right-3 z-10">
              {ouvert ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  Ouvert
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                  Fermé
                </span>
              )}
            </div>

            {restaurant.noteMoyenne && (
              <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-100">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span>{restaurant.noteMoyenne}</span>
              </div>
            )}
          </MediaFrame>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-base font-bold text-foreground transition-colors group-hover:text-primary line-clamp-1">
              {restaurant.nom}
            </h3>
          </div>

          {restaurant.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">{restaurant.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {(restaurant.delaiPreparationMin ?? restaurant.delaiMoyenMinutes) != null && (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5 font-medium text-foreground">
                <Clock className="size-3 text-primary" aria-hidden="true" />
                {restaurant.delaiPreparationMin ?? restaurant.delaiMoyenMinutes} min
              </span>
            )}
            {(restaurant.typesCuisine?.length ? restaurant.typesCuisine.slice(0, 2).join(' · ') : restaurant.specialiteCuisine) && (
              <span className="line-clamp-1 font-medium text-muted-foreground">
                {restaurant.typesCuisine?.length ? restaurant.typesCuisine.slice(0, 2).join(' · ') : restaurant.specialiteCuisine}
              </span>
            )}
            {restaurant.prixMoyen != null && (
              <span className="text-muted-foreground/80">
                · Plat ≈ {formatPrixFcfa(Math.round(restaurant.prixMoyen / 50) * 50)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

