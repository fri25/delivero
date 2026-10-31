import { ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [search, setSearch] = useState('');
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
        <h1 className="font-heading text-[1.7rem] leading-tight font-extrabold tracking-tight text-brand-navy sm:text-4xl dark:text-foreground">
          Envie de <span className="text-primary">bien manger</span> ?
        </h1>
        <p className="text-sm text-muted-foreground">
          Restaurants de Natitingou livrés en ~30 min · paiement{' '}
          {ESPECES_ACTIF ? 'en espèces ou Mobile Money' : 'par Mobile Money'}.
        </p>
      </header>

      <div className="sticky top-14 z-10 -mx-4 space-y-2.5 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md md:top-16 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="relative">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
          <Input
            placeholder="Restaurant ou plat : amiwo, poisson, alloco…"
            className="h-12 rounded-full border-transparent bg-muted pl-11 pr-10 text-sm transition-colors focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="size-4" />
            </button>
          )}

          {suggestionsOpen && suggestions.length > 0 && (
            <ul className="fade-in-0 slide-in-from-top-1 animate-in absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-2xl bg-card py-1.5 shadow-xl border border-border/80 duration-(--duration-fast)">
              {suggestions.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/restaurants/${r.id}`}
                    className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary/70 transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <span className="font-semibold text-foreground">{r.nom}</span>
                    <span className="text-xs text-primary font-medium">Voir le menu →</span>
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
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {search
              ? `Résultats pour « ${search} »`
              : filtresActifs(filtres)
                ? 'Restaurants filtrés'
                : 'Tous les restaurants à Natitingou'}
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            {visibleRestaurants.length} restaurant{visibleRestaurants.length > 1 ? 's' : ''}
          </span>
        </div>

        {isPending && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
            Impossible de charger les restaurants. Vérifiez votre connexion et réessayez.
          </p>
        )}

        {!isPending && !isError && visibleRestaurants.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
              <Search className="size-5" aria-hidden="true" />
            </div>
            <p className="text-base font-bold text-foreground">
              {search
                ? `Aucun restaurant ne correspond à « ${search} ».`
                : filtresActifs(filtres)
                  ? 'Aucun restaurant ne correspond à ces filtres.'
                  : 'Aucun restaurant ouvert pour le moment.'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Essayez une autre recherche, retirez des filtres ou explorez l'ensemble du catalogue.
            </p>
            {(search || filtresActifs(filtres)) && (
              <Button
                variant="outline"
                className="rounded-full mt-2"
                onClick={() => {
                  setSearch('');
                  setFiltres(FILTRES_VIDES);
                }}
              >
                <X className="size-4 mr-1.5" /> Réinitialiser les filtres
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {visibleRestaurants.map((restaurant, index) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} priority={index < 2} />
          ))}
        </div>
      </section>
    </div>
  );
}
