import { useState } from 'react';
import { Bike, Clock, Star } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRestaurant } from '@/api/restaurants';
import { useCartStore } from '@/stores/cart-store';
import { PlatCard } from '@/components/restaurants/PlatCard';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { BarrePanier } from '@/components/restaurants/BarrePanier';
import { getRestaurantImage } from '@/data/images';
import { formatPrixFcfa } from '@/lib/format';
import { fourchetteFrais } from '@/lib/quartiers';
import { useQuartiers } from '@/api/quartiers';
import type { Plat } from '@/api/types';

function ancre(categorie: string) {
  return `categorie-${categorie.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const { data: restaurant, isPending, isError, refetch } = useRestaurant(id);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const hasConflict = useCartStore((state) => state.hasConflict);
  const cartRestaurantId = useCartStore((state) => state.restaurantId);
  const cartItems = useCartStore((state) => state.items);
  const [conflictPlat, setConflictPlat] = useState<Plat | null>(null);
  const { data: quartiers } = useQuartiers();

  const ajouter = (plat: Plat) => {
    if (!restaurant) return;
    addItem(restaurant.id, restaurant.nom, {
      platId: plat.id,
      nom: plat.nom,
      prixUnitaire: Number(plat.prix),
      quantite: 1,
    });
  };

  const ajouterAuPanier = (plat: Plat) => {
    if (!restaurant) return;
    if (hasConflict(restaurant.id)) {
      setConflictPlat(plat);
      return;
    }
    ajouter(plat);
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="aspect-[3/2] w-full rounded-2xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-destructive/5 p-4 ring-1 ring-destructive/20">
        <p className="text-sm">Impossible de charger ce restaurant.</p>
        <Button variant="outline" className="mt-3" onClick={() => void refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!restaurant) {
    return <p className="text-sm text-destructive">Restaurant introuvable.</p>;
  }

  const platsParCategorie = new Map<string, Plat[]>();
  for (const plat of restaurant.plats) {
    const categorie = plat.categorie ?? 'Autres';
    platsParCategorie.set(categorie, [...(platsParCategorie.get(categorie) ?? []), plat]);
  }
  const categories = [...platsParCategorie.keys()];
  // The cart only ever holds one restaurant: show it here only if it is this one.
  const itemsIci = cartRestaurantId === restaurant.id ? cartItems : [];
  const quantiteDe = (platId: string) => itemsIci.find((item) => item.platId === platId)?.quantite ?? 0;
  const delai = restaurant.delaiPreparationMin ?? restaurant.delaiMoyenMinutes;
  // Delivery fee depends on the client's neighbourhood (Q-28), not the restaurant.
  const fourchette = fourchetteFrais(quartiers);

  return (
    <div className="mx-auto max-w-2xl lg:max-w-6xl">
      <header className="-mx-4 -mt-5 overflow-hidden md:mx-0 md:mt-0 md:rounded-3xl">
        <MediaFrame
          nom={restaurant.nom}
          image={restaurant.imageUrl ?? getRestaurantImage(restaurant.nom)}
          ratio="wide"
          priority
          className="max-h-72 w-full md:max-h-80"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-6">
            <span
              className={
                restaurant.statutOuverture
                  ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md'
                  : 'inline-flex items-center rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md'
              }
            >
              {restaurant.statutOuverture && <span className="size-1.5 animate-pulse rounded-full bg-white" />}
              {restaurant.statutOuverture ? 'Ouvert' : 'Fermé'}
            </span>
            <h1 className="font-heading mt-2 text-2xl font-bold drop-shadow-sm md:text-3xl text-white">{restaurant.nom}</h1>
            {restaurant.description && <p className="mt-1 line-clamp-2 text-sm text-white/90 leading-relaxed">{restaurant.description}</p>}
          </div>
        </MediaFrame>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
        {restaurant.noteMoyenne && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 font-bold text-amber-600 dark:text-amber-400">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {restaurant.noteMoyenne}
          </span>
        )}
        {delai != null && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-1 font-medium text-foreground">
            <Clock className="size-3.5 text-primary" aria-hidden="true" /> {delai} min de préparation
          </span>
        )}
        {fourchette && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-2.5 py-1 font-medium text-foreground">
            <Bike className="size-3.5 text-primary" aria-hidden="true" /> Livraison{' '}
            {fourchette.min === fourchette.max
              ? formatPrixFcfa(fourchette.min)
              : `${new Intl.NumberFormat('fr-FR').format(fourchette.min)} à ${formatPrixFcfa(fourchette.max)}`}
          </span>
        )}
        {restaurant.horaires && (
          <span className="rounded-full bg-secondary/60 px-2.5 py-1 text-xs">{restaurant.horaires}</span>
        )}
      </div>

      {!restaurant.statutOuverture && (
        <div className="mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          Ce restaurant est fermé pour le moment : vous pouvez consulter le menu, mais pas commander.
        </div>
      )}

      {categories.length > 1 && (
        <nav
          aria-label="Catégories du menu"
          className="sticky top-14 z-10 -mx-4 mt-4 flex gap-2 overflow-x-auto bg-background/85 px-4 py-2.5 backdrop-blur-xl border-b border-border/40 [scrollbar-width:none] md:top-16"
        >
          {categories.map((categorie) => (
            <a
              key={categorie}
              href={`#${ancre(categorie)}`}
              className="shrink-0 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:border-primary/40 hover:bg-secondary active:scale-95 whitespace-nowrap"
            >
              {categorie}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="space-y-6">
          {[...platsParCategorie.entries()].map(([categorie, plats]) => (
            <section
              key={categorie}
              id={ancre(categorie)}
              className="scroll-mt-32 rounded-3xl bg-card border border-border/70 p-4 sm:p-5 shadow-2xs"
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                <span className="size-2 rounded-full bg-primary" />
                <h2 className="font-heading text-base sm:text-lg font-bold text-foreground">{categorie}</h2>
                <span className="text-xs text-muted-foreground ml-auto">{plats.length} choix</span>
              </div>
              <div className="divide-y divide-border/50">
                {plats.map((plat) => (
                  <PlatCard
                    key={plat.id}
                    plat={plat}
                    quantite={quantiteDe(plat.id)}
                    commandable={restaurant.statutOuverture}
                    onAjouter={ajouterAuPanier}
                    onRetirer={(p) => updateQuantity(p.id, quantiteDe(p.id) - 1)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="lg:sticky lg:top-24">
          <BarrePanier items={itemsIci} />
        </div>
      </div>

      <Dialog open={conflictPlat !== null} onOpenChange={(open) => !open && setConflictPlat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vider le panier ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Votre panier contient des plats d'un autre restaurant. Une commande ne peut concerner qu'un seul
            restaurant à la fois.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictPlat(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!conflictPlat) return;
                ajouter(conflictPlat);
                toast.success(`${conflictPlat.nom} ajouté au panier`);
                setConflictPlat(null);
              }}
            >
              Vider et ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
