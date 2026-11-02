import { ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRestaurants } from '@/api/restaurants';
import { RestaurantCard } from '@/components/restaurants/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/restaurants/RestaurantCardSkeleton';
import { RestaurantRail } from '@/components/restaurants/RestaurantRail';
import { CatalogueFilters } from '@/components/restaurants/CatalogueFilters';
import { CategoryCarousel } from '@/components/restaurants/CategoryCarousel';
import {
  FILTRES_VIDES,
  filtrerRestaurants,
  filtresActifs,
  type FiltresCatalogue,
} from '@/lib/filtres-catalogue';
import type { TypeCuisine } from '@delivero/config/types-cuisine';

export function RepasHomePage() {
  // Prefilled by the home search box (/repas?q=…).
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [filtres, setFiltres] = useState<FiltresCatalogue>(FILTRES_VIDES);

  // Source de suggestions : le catalogue complet chargé une fois
  const { data: allRestaurants } = useRestaurants();
  const { data: restaurants, isPending, isError } = useRestaurants(search || undefined);

  const suggestions = useMemo(() => {
    if (!search.trim() || !allRestaurants) return [];
    const query = search.trim().toLowerCase();
    return allRestaurants.filter((r) => r.nom.toLowerCase().includes(query)).slice(0, 5);
  }, [search, allRestaurants]);

  const visibleRestaurants = useMemo(
    () => filtrerRestaurants(restaurants ?? [], filtres),
    [restaurants, filtres],
  );

  const ouvertsMaintenant = useMemo(
    () => (allRestaurants ?? []).filter((r) => r.statutOuverture).slice(0, 6),
    [allRestaurants],
  );

  const handleSelectCuisine = (cuisine: TypeCuisine | null) => {
    setFiltres((prev) => ({ ...prev, cuisine }));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-1">
        <h1 className="titre-page">
          Repas
        </h1>
        <p className="text-sm text-muted-foreground">
          Restaurants de Natitingou livrés en ~30 min · paiement{' '}
          {ESPECES_ACTIF ? 'en espèces ou Mobile Money' : 'par Mobile Money'}.
        </p>
      </header>

      <div className="sticky top-14 z-10 -mx-4 space-y-3 border-b border-border bg-background px-4 pt-3 pb-3 md:top-17 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Restaurant ou plat : amiwo, poisson, alloco…"
            className="h-12 rounded-2xl border-0 bg-card pl-10.5 pr-10 text-[15px] shadow-(--shadow-carte) focus-visible:ring-2 focus-visible:ring-primary/30"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="size-4" />
            </button>
          )}

          {suggestionsOpen && suggestions.length > 0 && (
            <ul className="fade-in-0 slide-in-from-top-1 animate-in absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-md duration-(--duration-fast)">
              {suggestions.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/restaurants/${r.id}`}
                    className="flex min-h-11 items-center justify-between px-3.5 text-[15px] hover:bg-secondary"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <span className="font-semibold text-foreground">{r.nom}</span>
                    <span className="text-sm text-muted-foreground">Voir le menu</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <CategoryCarousel activeCuisine={filtres.cuisine} onSelectCuisine={handleSelectCuisine} />

        <CatalogueFilters filtres={filtres} onChange={setFiltres} />
      </div>

      {!search && !filtresActifs(filtres) && (
        <RestaurantRail titre="Ouverts maintenant" restaurants={ouvertsMaintenant} />
      )}

      {/* Grille principale : Restaurants */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-xl font-extrabold tracking-tight md:text-2xl">
            {search
              ? `Résultats pour « ${search} »`
              : filtresActifs(filtres)
                ? 'Restaurants filtrés'
                : 'Tous les restaurants à Natitingou'}
          </h2>
          <span className="shrink-0 text-sm text-muted-foreground">
            {visibleRestaurants.length} restaurant{visibleRestaurants.length > 1 ? 's' : ''}
          </span>
        </div>

        {isPending && (
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <p className="rounded-lg border border-destructive/40 px-4 py-3 text-sm font-medium text-destructive">
            Impossible de charger les restaurants. Vérifiez votre connexion et réessayez.
          </p>
        )}

        {!isPending && !isError && visibleRestaurants.length === 0 && (
          <div className="carte flex flex-col items-start gap-2 p-5">
            <p className="text-base font-bold text-foreground">
              {search
                ? `Aucun restaurant ne correspond à « ${search} ».`
                : filtresActifs(filtres)
                  ? 'Aucun restaurant ne correspond à ces filtres.'
                  : 'Aucun restaurant ouvert pour le moment.'}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Essayez une autre recherche, retirez des filtres ou explorez l'ensemble du catalogue.
            </p>
            {(search || filtresActifs(filtres)) && (
              <Button
                variant="outline"
                className="mt-2 h-11 font-bold"
                onClick={() => {
                  setSearch('');
                  setFiltres(FILTRES_VIDES);
                }}
              >
                Réinitialiser la recherche et les filtres
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRestaurants.map((restaurant, index) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} priority={index < 2} />
          ))}
        </div>
      </section>
    </div>
  );
}
