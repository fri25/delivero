import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RestaurantSummary } from '@/api/types';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { getRestaurantImage } from '@/data/images';

/**
 * Open restaurants, shared by the home hub and the Repas page: white cards
 * with a wide photo, horizontal scroll on mobile, grid from md.
 */
export function RestaurantRail({
  titre,
  restaurants,
  lienTout,
}: {
  titre: string;
  restaurants: RestaurantSummary[];
  /** Destination of the "Tout voir" link; omitted when already on the list. */
  lienTout?: string;
}) {
  if (restaurants.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-extrabold tracking-tight md:text-2xl">{titre}</h2>
        {lienTout && (
          <Link to={lienTout} className="flex min-h-11 items-center text-sm font-bold text-primary hover:underline">
            Tout voir
          </Link>
        )}
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
        {restaurants.map((r) => (
          <Link
            key={r.id}
            to={`/restaurants/${r.id}`}
            className="carte group w-64 shrink-0 snap-start overflow-hidden transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:w-auto"
          >
            <MediaFrame nom={r.nom} image={r.imageUrl ?? getRestaurantImage(r.nom)} ratio="wide" />
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-1 font-bold">{r.nom}</p>
                {r.noteMoyenne && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-xs font-bold tabular-nums">
                    <Star className="size-3 fill-current" aria-hidden="true" />
                    {r.noteMoyenne}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {r.typesCuisine?.[0] ?? 'Cuisine locale'} · {r.delaiPreparationMin ?? r.delaiMoyenMinutes ?? 20} min
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
