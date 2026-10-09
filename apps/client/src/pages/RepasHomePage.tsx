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
  const [cuisine, setCuisine] = useState('toutes');
  const [budget, setBudget] = useState('tous');
  const [noteMin, setNoteMin] = useState('toutes');
  const [delaiMax, setDelaiMax] = useState('tous');

  // Source de suggestions : le catalogue complet, chargé une fois, filtré côté
  // client — pas d'aller-retour réseau à chaque frappe pour la liste déroulante.
  const { data: allRestaurants } = useRestaurants();
  const { data: restaurants, isPending, isError, refetch } = useRestaurants(search || undefined);

  const suggestions = useMemo(() => {
    if (!search.trim() || !allRestaurants) return [];
    const query = search.trim().toLowerCase();
    return allRestaurants.filter((r) => r.nom.toLowerCase().includes(query)).slice(0, 5);
  }, [search, allRestaurants]);

  const cuisines = useMemo(
    () => [...new Set((allRestaurants ?? []).map((restaurant) => restaurant.specialiteCuisine?.trim()).filter((value): value is string => Boolean(value)))].sort(),
    [allRestaurants],
  );

  const visibleRestaurants = useMemo(() => (restaurants ?? []).filter((restaurant) => {
    if (openOnly && !restaurant.statutOuverture) return false;
    if (cuisine !== 'toutes' && restaurant.specialiteCuisine !== cuisine) return false;
    if (budget === 'accessible' && (restaurant.prixMoyen == null || restaurant.prixMoyen > 1500)) return false;
    if (budget === 'moyen' && (restaurant.prixMoyen == null || restaurant.prixMoyen <= 1500 || restaurant.prixMoyen > 3000)) return false;
    if (budget === 'premium' && (restaurant.prixMoyen == null || restaurant.prixMoyen <= 3000)) return false;
    if (noteMin !== 'toutes' && (restaurant.noteMoyenne == null || Number(restaurant.noteMoyenne) < Number(noteMin))) return false;
    if (delaiMax !== 'tous' && (restaurant.delaiMoyenMinutes == null || restaurant.delaiMoyenMinutes > Number(delaiMax))) return false;
    return true;
  }), [restaurants, openOnly, cuisine, budget, noteMin, delaiMax]);

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
          Choisissez votre restaurant, composez votre menu et suivez la livraison à chaque étape.
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

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="sr-only" htmlFor="filtre-cuisine">Cuisine</label>
          <select id="filtre-cuisine" value={cuisine} onChange={(event) => setCuisine(event.target.value)} className="h-11 min-w-0 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="toutes">Toutes les cuisines</option>{cuisines.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <label className="sr-only" htmlFor="filtre-budget">Budget moyen</label>
          <select id="filtre-budget" value={budget} onChange={(event) => setBudget(event.target.value)} className="h-11 min-w-0 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="tous">Tous les budgets</option><option value="accessible">Accessible · ≤ 1 500 F</option><option value="moyen">Intermédiaire · 1 501–3 000 F</option><option value="premium">Plus de 3 000 F</option>
          </select>
          <label className="sr-only" htmlFor="filtre-note">Note minimale</label>
          <select id="filtre-note" value={noteMin} onChange={(event) => setNoteMin(event.target.value)} className="h-11 min-w-0 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="toutes">Toutes les notes</option><option value="3">3 étoiles et plus</option><option value="4">4 étoiles et plus</option>
          </select>
          <label className="sr-only" htmlFor="filtre-delai">Délai de préparation</label>
          <select id="filtre-delai" value={delaiMax} onChange={(event) => setDelaiMax(event.target.value)} className="h-11 min-w-0 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="tous">Tous les délais</option><option value="30">≤ 30 minutes</option><option value="45">≤ 45 minutes</option><option value="60">≤ 60 minutes</option>
          </select>
        </div>
      </div>

      {!search && !openOnly && cuisine === 'toutes' && budget === 'tous' && noteMin === 'toutes' && delaiMax === 'tous' && ouvertsMaintenant.length > 0 && (
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
          <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p>Le catalogue n’a pas pu être chargé. Vérifiez votre connexion, puis réessayez.</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Réessayer</Button>
          </div>
        )}

        {!isPending && !isError && visibleRestaurants.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-secondary/60 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">
              {search ? `Aucun restaurant ne correspond à « ${search} ».` : 'Aucun restaurant ouvert pour le moment.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Essayez un autre nom, ou explorez tout le catalogue.
            </p>
            {(search || openOnly || cuisine !== 'toutes' || budget !== 'tous' || noteMin !== 'toutes' || delaiMax !== 'tous') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setOpenOnly(false);
                  setCuisine('toutes');
                  setBudget('tous');
                  setNoteMin('toutes');
                  setDelaiMax('tous');
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
