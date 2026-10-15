import { ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
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
import { CatalogueFilters } from '@/components/restaurants/CatalogueFilters';
import {
  FILTRES_VIDES,
  filtrerRestaurants,
  filtresActifs,
  type FiltresCatalogue,
} from '@/lib/filtres-catalogue';

export function RepasHomePage() {
  const [search, setSearch] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [filtres, setFiltres] = useState<FiltresCatalogue>(FILTRES_VIDES);

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
    () => filtrerRestaurants(restaurants ?? [], filtres),
    [restaurants, filtres],
  );

  const ouvertsMaintenant = useMemo(
    () => (allRestaurants ?? []).filter((r) => r.statutOuverture).slice(0, 6),
    [allRestaurants],
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-[#0c2f66] to-brand-blue p-6 text-white shadow-lg md:p-8">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-brand-light/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-md mb-2">
            🍔 Livraison de plats chauds à Natitingou
          </span>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-white lg:text-3xl">
            Natitingou a faim ? On s'en occupe.
          </h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed">
            Vos restaurants préférés livrés en un éclair — payez{' '}
            {ESPECES_ACTIF ? 'en espèces ou en Mobile Money' : 'par Mobile Money'}.
          </p>
        </div>
      </div>

      <div className="sticky top-14 z-10 md:top-16 -mx-4 bg-background/85 px-4 py-3 backdrop-blur-xl border-b border-border/40 shadow-xs">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Un restaurant, un plat..."
            className="h-11 rounded-2xl border-border/60 bg-card pl-10 pr-9 text-sm shadow-xs transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
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
                    <span className="font-medium">{r.nom}</span>
                    <span className="text-xs text-muted-foreground">Voir le menu →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <CatalogueFilters filtres={filtres} onChange={setFiltres} />
      </div>

      {!search && !filtresActifs(filtres) && ouvertsMaintenant.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold tracking-wider text-foreground uppercase flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Ouverts maintenant
            </h2>
            <span className="text-xs text-muted-foreground">{ouvertsMaintenant.length} disponibles</span>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
            {ouvertsMaintenant.map((r) => (
              <Link
                key={r.id}
                to={`/restaurants/${r.id}`}
                className="group w-44 shrink-0 snap-start overflow-hidden rounded-2xl bg-card border border-border/70 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/30"
              >
                <div className="relative overflow-hidden">
                  <MediaFrame
                    nom={r.nom}
                    image={r.imageUrl ?? getRestaurantImage(r.nom)}
                    ratio="square"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-1 text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {r.nom}
                  </p>
                  {(r.delaiPreparationMin ?? r.delaiMoyenMinutes) != null && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ~{r.delaiPreparationMin ?? r.delaiMoyenMinutes} min
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-semibold tracking-wide text-foreground uppercase">
          {search ? `Résultats pour « ${search} »` : filtresActifs(filtres) ? 'Résultats filtrés' : 'Tous les restaurants'}
        </h2>

        {isPending && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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
              {search
                ? `Aucun restaurant ne correspond à « ${search} ».`
                : filtresActifs(filtres)
                  ? 'Aucun restaurant ne correspond à ces filtres.'
                  : 'Aucun restaurant ouvert pour le moment.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Essayez un autre nom, ou explorez tout le catalogue.
            </p>
            {(search || filtresActifs(filtres)) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setFiltres(FILTRES_VIDES);
                }}
              >
                <X /> Réinitialiser
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {visibleRestaurants.map((restaurant, index) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} priority={index < 2} />
          ))}
        </div>
      </section>
    </div>
  );
}
