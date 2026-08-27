import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRestaurants } from '@/api/restaurants';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/restaurants/RestaurantCardSkeleton';
import { getRestaurantImage } from '@/data/images';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { cn } from '@/lib/utils';

export function RepasHomePage() {
  const [search, setSearch] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);

  // Source de suggestions : le catalogue complet, chargé une fois, filtré côté
  // client — pas d'aller-retour réseau à chaque frappe pour la liste déroulante.
  const { data: allRestaurants } = useRestaurants();
  const { data: restaurants, isPending, isError } = useRestaurants(search || undefined);

  const suggestions = useMemo(() => {
    if (!search.trim() || !allRestaurants) return [];
    const query = search.trim().toLowerCase();
    return allRestaurants.filter((r) => r.nom.toLowerCase().includes(query)).slice(0, 5);
  }, [search, allRestaurants]);

  const visibleRestaurants = useMemo(
    () => (openOnly ? (restaurants ?? []).filter((r) => r.statutOuverture) : (restaurants ?? [])),
    [restaurants, openOnly],
  );

  const ouvertsMaintenant = useMemo(
    () => (allRestaurants ?? []).filter((r) => r.statutOuverture).slice(0, 6),
    [allRestaurants],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
          Natitingou a faim ? On s'en occupe.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos restaurants préférés, livrés chez vous — payez en espèces ou en Mobile Money.
        </p>
      </div>

      <div className="sticky top-14 z-10 -mx-4 bg-background/90 px-4 py-2.5 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Un restaurant, un plat..."
            className="h-11 rounded-full border-transparent bg-secondary pl-9 text-base shadow-sm focus-visible:border-ring focus-visible:bg-card"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 100)}
          />
          {suggestionsOpen && suggestions.length > 0 && (
            <ul className="fade-in-0 slide-in-from-top-1 animate-in absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl bg-card py-1 shadow-lg ring-1 ring-foreground/10 duration-(--duration-fast)">
              {suggestions.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/restaurants/${r.id}`}
                    className="block px-3.5 py-2 text-sm hover:bg-secondary"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {r.nom}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          <button
            type="button"
            aria-pressed={openOnly}
            onClick={() => setOpenOnly((v) => !v)}
            className={cn(
              'h-8 shrink-0 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors',
              openOnly
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
            )}
          >
            Ouverts maintenant
          </button>
        </div>
      </div>

      {!search && ouvertsMaintenant.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="font-heading text-sm font-semibold tracking-wide text-foreground uppercase">
            Ouverts maintenant
          </h2>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {ouvertsMaintenant.map((r) => (
              <Link
                key={r.id}
                to={`/restaurants/${r.id}`}
                className="w-40 shrink-0 snap-start overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
              >
                <MediaFrame nom={r.nom} image={r.imageUrl ?? getRestaurantImage(r.nom)} ratio="square" />
                <p className="line-clamp-1 px-2.5 py-2 text-xs font-medium">{r.nom}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-semibold tracking-wide text-foreground uppercase">
          {search ? `Résultats pour « ${search} »` : 'Tous les restaurants'}
        </h2>

        {isPending && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Impossible de charger les restaurants. Vérifiez votre connexion et réessayez.
          </p>
        )}

        {!isPending && !isError && visibleRestaurants.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-secondary/60 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">
              {search ? `Aucun restaurant ne correspond à « ${search} ».` : 'Aucun restaurant ouvert pour le moment.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Essayez un autre nom, ou explorez tout le catalogue.
            </p>
            {(search || openOnly) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setOpenOnly(false);
                }}
              >
                <X /> Réinitialiser
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visibleRestaurants.map((restaurant, index) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} priority={index < 2} />
          ))}
        </div>
      </section>
    </div>
  );
}
