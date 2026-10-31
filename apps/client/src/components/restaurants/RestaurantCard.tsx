import { Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { getRestaurantImage } from '@/data/images';
import type { RestaurantSummary } from '@/api/types';
import { formatPrixFcfa } from '@/lib/format';
import { cn } from '@/lib/utils';

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
  const delai = restaurant.delaiPreparationMin ?? restaurant.delaiMoyenMinutes ?? 25;
  const cuisine = restaurant.typesCuisine?.length
    ? restaurant.typesCuisine.slice(0, 2).join(' · ')
    : restaurant.specialiteCuisine;

  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="group fill-mode-both animate-in slide-in-from-bottom-3 fade-in-0 block duration-(--duration-base) ease-(--ease-signature) focus-visible:outline-none"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <article>
        <div className="relative overflow-hidden rounded-3xl ring-1 ring-border transition-shadow duration-(--duration-fast) group-hover:shadow-lg group-hover:shadow-primary/10 group-focus-visible:ring-2 group-focus-visible:ring-ring">
          <MediaFrame
            nom={restaurant.nom}
            image={image}
            ratio="wide"
            priority={priority}
            className={cn(!ouvert && 'opacity-70 grayscale-[60%]')}
          >
            <span
              className={cn(
                'absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
                ouvert ? 'bg-white text-foreground' : 'bg-brand-red text-white',
              )}
            >
              {ouvert ? (
                <>
                  <Clock className="size-3.5 text-primary" aria-hidden="true" />
                  {delai} min
                </>
              ) : (
                'Fermé'
              )}
            </span>
          </MediaFrame>
        </div>

        <div className="space-y-0.5 px-1 pt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 font-heading text-base font-bold text-foreground group-hover:text-primary">
              {restaurant.nom}
            </h3>
            {restaurant.noteMoyenne && (
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-foreground">
                <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
                {restaurant.noteMoyenne}
              </span>
            )}
          </div>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {[cuisine, restaurant.prixMoyen != null && `Plat dès ${formatPrixFcfa(Math.round(restaurant.prixMoyen / 50) * 50)}`]
              .filter(Boolean)
              .join(' · ') || restaurant.description}
          </p>
        </div>
      </article>
    </Link>
  );
}
