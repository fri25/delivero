import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Bike, Clock, Info, Star } from 'lucide-react';
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
import { useSectionActive } from '@/lib/section-active';
import type { Plat } from '@/api/types';
import { cn } from '@/lib/utils';

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
  const navRef = useRef<HTMLElement>(null);

  const platsParCategorie = new Map<string, Plat[]>();
  for (const plat of restaurant?.plats ?? []) {
    const categorie = plat.categorie ?? 'Autres';
    platsParCategorie.set(categorie, [...(platsParCategorie.get(categorie) ?? []), plat]);
  }
  const categories = [...platsParCategorie.keys()];
  const sectionActive = useSectionActive(categories.map(ancre));

  // Garde la puce active visible dans la barre horizontale
  useEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!nav || !chip) return;
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nav.scrollTo({ left: chip.offsetLeft - 16, behavior: reduit ? 'auto' : 'smooth' });
  }, [sectionActive]);

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
      <div className="mx-auto max-w-2xl lg:max-w-6xl space-y-4" aria-busy="true" aria-label="Chargement du menu">
        <Skeleton className="-mx-4 -mt-5 h-64 rounded-none md:mx-0 md:mt-0 md:rounded-3xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <div className="space-y-3 rounded-3xl border border-border/70 bg-card p-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex items-center gap-3.5 p-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="size-20 shrink-0 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl bg-destructive/10 p-6 text-center border border-destructive/20 max-w-md mx-auto">
        <p className="text-sm font-semibold text-destructive">Impossible de charger ce restaurant.</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => void refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!restaurant) {
    return <p className="text-sm text-destructive">Restaurant introuvable.</p>;
  }

  const itemsIci = cartRestaurantId === restaurant.id ? cartItems : [];
  const quantiteDe = (platId: string) => itemsIci.find((item) => item.platId === platId)?.quantite ?? 0;
  const delai = restaurant.delaiPreparationMin ?? restaurant.delaiMoyenMinutes ?? 20;
  const fourchette = fourchetteFrais(quartiers);

  return (
    <div className="mx-auto max-w-2xl lg:max-w-6xl space-y-6">
      <header>
        <div className="-mx-4 -mt-5 overflow-hidden md:mx-0 md:mt-0 md:rounded-3xl">
          <MediaFrame
            nom={restaurant.nom}
            image={restaurant.imageUrl ?? getRestaurantImage(restaurant.nom)}
            ratio="wide"
            priority
            className="max-h-64 w-full md:max-h-80"
          />
        </div>

        <div className="relative z-10 mx-auto -mt-10 max-w-3xl space-y-3 rounded-3xl bg-card p-4 shadow-lg shadow-primary/10 ring-1 ring-border sm:p-6 md:-mt-14">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
                restaurant.statutOuverture ? 'bg-secondary text-primary' : 'bg-brand-red text-white',
              )}
            >
              {restaurant.statutOuverture && <span className="size-1.5 animate-pulse rounded-full bg-primary" />}
              {restaurant.statutOuverture ? 'Ouvert maintenant' : 'Fermé actuellement'}
            </span>
            {restaurant.typesCuisine?.length ? (
              <span className="text-xs font-medium text-muted-foreground">{restaurant.typesCuisine.join(' · ')}</span>
            ) : null}
          </div>

          <h1 className="flex items-center gap-2 font-heading text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl dark:text-foreground">
            <span>{restaurant.nom}</span>
            <BadgeCheck className="size-5 shrink-0 text-primary sm:size-6" aria-label="Partenaire vérifié" />
          </h1>

          {restaurant.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{restaurant.description}</p>
          )}

          <dl className="grid grid-cols-3 divide-x divide-border border-t border-border pt-3 text-center">
            <div className="px-1">
              <dt className="text-[11px] text-muted-foreground">Note</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1 text-sm font-bold text-foreground">
                <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
                {restaurant.noteMoyenne ?? '—'}
              </dd>
            </div>
            <div className="px-1">
              <dt className="text-[11px] text-muted-foreground">Préparation</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1 text-sm font-bold text-foreground">
                <Clock className="size-3.5 text-primary" aria-hidden="true" />~{delai} min
              </dd>
            </div>
            <div className="px-1">
              <dt className="text-[11px] text-muted-foreground">Livraison</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1 text-sm font-bold text-foreground tabular-nums">
                <Bike className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                {fourchette
                  ? fourchette.min === fourchette.max
                    ? formatPrixFcfa(fourchette.min)
                    : `dès ${formatPrixFcfa(fourchette.min)}`
                  : 'selon quartier'}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {!restaurant.statutOuverture && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-brand-red/25 bg-brand-red/5 p-4 text-sm text-foreground"
        >
          <Info className="mt-0.5 size-5 shrink-0 text-brand-red" aria-hidden="true" />
          <span>
            Ce restaurant est fermé pour le moment : vous pouvez consulter le menu, mais les commandes sont temporairement suspendues.
          </span>
        </div>
      )}

      {categories.length > 1 && (
        <nav
          ref={navRef}
          aria-label="Catégories du menu"
          className="sticky top-14 z-20 -mx-4 flex gap-2 overflow-x-auto border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-xl [scrollbar-width:none] md:top-16"
        >
          {categories.map((categorie) => {
            const active = sectionActive === ancre(categorie);
            return (
              <a
                key={categorie}
                href={`#${ancre(categorie)}`}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'inline-flex min-h-9 shrink-0 cursor-pointer items-center rounded-full border px-4 text-xs font-bold whitespace-nowrap transition-colors duration-200 active:scale-95 sm:text-sm',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground/80 hover:border-primary/40',
                )}
              >
                {categorie}
              </a>
            );
          })}
        </nav>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="space-y-6 sm:space-y-8">
          {[...platsParCategorie.entries()].map(([categorie, plats]) => (
            <section
              key={categorie}
              id={ancre(categorie)}
              className="scroll-mt-36 space-y-3"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-heading text-lg font-bold text-foreground">{categorie}</h2>
                <span className="text-xs font-medium text-muted-foreground">{plats.length} choix</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
        <DialogContent className="rounded-3xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">Vider le panier actuel ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Votre panier contient des plats d'un autre restaurant. Chez ChapExpress, une commande ne concerne qu'un seul restaurant à la fois.
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" className="rounded-full" onClick={() => setConflictPlat(null)}>
              Conserver l'ancien panier
            </Button>
            <Button
              className="rounded-full bg-primary font-bold"
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
