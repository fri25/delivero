import { ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RestaurantSummary } from '@/api/types';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { getRestaurantImage } from '@/data/images';

/**
 * Horizontal rail of open restaurants, shared by the home hub and the Repas
 * page. Photos stay clean (no dark overlay): the delay sits under the name.
 */
export function RestaurantRail({
  titre,
  restaurants,
  lienTout,
}: {
  titre: string;
  restaurants: RestaurantSummary[];
  /** Destination of the "Voir tout" link; omitted when already on the list. */
  lienTout?: string;
}) {
  if (restaurants.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
          <Flame className="size-4.5 text-brand-red" aria-hidden="true" />
          <span>{titre}</span>
        </h2>
        {lienTout ? (
          <Link
            to={lienTout}
            className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <span>Voir tout</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {restaurants.length} ouvert{restaurants.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
        {restaurants.map((r) => (
          <Link
            key={r.id}
            to={`/restaurants/${r.id}`}
            className="group w-40 shrink-0 snap-start sm:w-44 focus-visible:outline-none"
          >
            <div className="overflow-hidden rounded-2xl ring-1 ring-border transition-shadow duration-(--duration-fast) group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <MediaFrame nom={r.nom} image={r.imageUrl ?? getRestaurantImage(r.nom)} ratio="square" />
            </div>
            <p className="mt-2 line-clamp-1 text-sm font-bold text-foreground group-hover:text-primary">{r.nom}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-brand-red" aria-hidden="true" />
              <span className="truncate">
                ~{r.delaiPreparationMin ?? r.delaiMoyenMinutes ?? 20} min · {r.typesCuisine?.[0] ?? 'Cuisine locale'}
              </span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
