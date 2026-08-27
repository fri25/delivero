import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { getRestaurantImage } from '@/data/images';
import type { RestaurantSummary } from '@/api/types';

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
      <article className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-(--duration-fast) ease-(--ease-signature) group-hover:-translate-y-0.5 group-hover:shadow-lg group-active:translate-y-0 group-active:shadow-none group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <MediaFrame
          nom={restaurant.nom}
          image={image}
          ratio="wide"
          priority={priority}
          vignette
          className={ouvert ? undefined : 'grayscale-[55%]'}
        >
          <Badge
            variant="secondary"
            className={
              ouvert
                ? 'absolute top-2.5 right-2.5 border-0 bg-brand-mangue text-white'
                : 'absolute top-2.5 right-2.5 border-0 bg-black/55 text-white'
            }
          >
            {ouvert ? 'Ouvert' : 'Fermé'}
          </Badge>
          <h3 className="font-heading absolute inset-x-3 bottom-2.5 line-clamp-1 text-base font-semibold text-white drop-shadow-sm">
            {restaurant.nom}
          </h3>
        </MediaFrame>

        <div className="space-y-1 px-3.5 py-3 text-sm text-muted-foreground">
          {restaurant.description && <p className="line-clamp-1">{restaurant.description}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {restaurant.noteMoyenne && (
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Star className="size-3.5 fill-brand-gingembre text-brand-gingembre" />
                {restaurant.noteMoyenne}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
