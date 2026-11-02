import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { getRestaurantImage } from '@/data/images';
import type { RestaurantSummary } from '@/api/types';
import { formatPrixFcfa } from '@/lib/format';
import { miniature } from '@/lib/medias';
import { cn } from '@/lib/utils';

export function RestaurantCard({
  restaurant,
  priority = false,
}: {
  restaurant: RestaurantSummary;
  priority?: boolean;
}) {
  const image = restaurant.imageUrl ?? getRestaurantImage(restaurant.nom);
  const ouvert = restaurant.statutOuverture;
  const delai = restaurant.delaiPreparationMin ?? restaurant.delaiMoyenMinutes ?? 25;
  const cuisine = restaurant.typesCuisine?.length
    ? restaurant.typesCuisine.slice(0, 2).join(', ')
    : restaurant.specialiteCuisine;

  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="carte group block overflow-hidden transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <article>
        <MediaFrame
          nom={restaurant.nom}
          image={image}
          ratio="wide"
          priority={priority}
          className={cn(!ouvert && 'grayscale-[70%]')}
        >
          {!ouvert && (
            <span className="absolute top-3 left-3 z-10 rounded-full bg-foreground px-2.5 py-1 text-xs font-bold text-background">
              Fermé
            </span>
          )}
          {restaurant.logoUrl && (
            <img
              src={miniature(restaurant.logoUrl, 96)}
              alt=""
              loading="lazy"
              className="absolute bottom-3 left-3 z-10 size-11 rounded-lg bg-white object-contain ring-2 ring-white"
            />
          )}
        </MediaFrame>

        <div className="p-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="line-clamp-1 text-[17px] font-bold">{restaurant.nom}</h3>
            {restaurant.noteMoyenne && (
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums">
                <Star className="size-3.5 fill-current" aria-hidden="true" />
                {restaurant.noteMoyenne}
              </span>
            )}
          </div>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {[
              cuisine,
              ouvert && `${delai} min`,
              restaurant.prixMoyen != null && `plat dès ${formatPrixFcfa(Math.round(restaurant.prixMoyen / 50) * 50)}`,
            ]
              .filter(Boolean)
              .join(' · ') || restaurant.description}
          </p>
        </div>
      </article>
    </Link>
  );
}
