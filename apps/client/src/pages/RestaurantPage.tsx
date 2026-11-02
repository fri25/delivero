import { useEffect, useRef, useState } from 'react';
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
import { miniature } from '@/lib/medias';
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

  // Garde l'onglet actif visible dans la barre horizontale
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
      <div className="mx-auto max-w-2xl space-y-4 lg:max-w-6xl" aria-busy="true" aria-label="Chargement du menu">
        <Skeleton className="-mx-4 -mt-5 h-56 rounded-none md:mx-0 md:mt-0 md:h-72 md:rounded-xl" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="divide-y divide-border">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex items-center gap-4 py-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="size-24 shrink-0 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="carte mx-auto max-w-md p-6">
        <p className="font-bold">Impossible de charger ce restaurant.</p>
        <p className="mt-1 text-sm text-muted-foreground">Vérifiez votre connexion, puis réessayez.</p>
        <Button variant="outline" className="mt-4 h-11 font-bold" onClick={() => void refetch()}>
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
  const ouvert = restaurant.statutOuverture;

  const reperes = [
    { terme: 'Préparation', valeur: `~${delai} min` },
    {
      terme: 'Livraison',
      valeur: fourchette
        ? fourchette.min === fourchette.max
          ? formatPrixFcfa(fourchette.min)
          : `dès ${formatPrixFcfa(fourchette.min)}`
        : 'selon quartier',
    },
    ...(restaurant.noteMoyenne ? [{ terme: 'Note', valeur: `${restaurant.noteMoyenne} / 5` }] : []),
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:max-w-6xl">
      <header className="space-y-4">
        <MediaFrame
          nom={restaurant.nom}
          image={restaurant.imageUrl ?? getRestaurantImage(restaurant.nom)}
          ratio="wide"
          priority
          className={cn('-mx-4 -mt-5 aspect-auto h-52 md:mx-0 md:mt-0 md:h-72 md:rounded-3xl', !ouvert && 'grayscale-[70%]')}
        />

        <div className="flex items-center gap-3">
          {restaurant.logoUrl && (
            <img
              src={miniature(restaurant.logoUrl, 160)}
              alt=""
              className="size-14 shrink-0 rounded-lg bg-white object-contain ring-1 ring-border"
            />
          )}
          <div className="min-w-0">
            <h1 className="titre-page">
              {restaurant.nom}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <span className={cn('inline-flex items-center gap-1.5 font-semibold', ouvert ? 'text-foreground' : 'text-muted-foreground')}>
                <span className={cn('size-2 rounded-full', ouvert ? 'bg-primary' : 'bg-[#8a93a3]')} aria-hidden="true" />
                {ouvert ? 'Ouvert' : 'Fermé'}
              </span>
              {restaurant.typesCuisine?.length ? <span>· {restaurant.typesCuisine.join(', ')}</span> : null}
            </p>
          </div>
        </div>

        {restaurant.description && (
          <p className="line-clamp-3 max-w-2xl text-[15px] text-muted-foreground">{restaurant.description}</p>
        )}

        <dl className="flex flex-wrap gap-2">
          {reperes.map(({ terme, valeur }) => (
            <div key={terme} className="carte min-w-28 px-3.5 py-2.5">
              <dt className="text-xs text-muted-foreground">{terme}</dt>
              <dd className="text-[15px] font-bold tabular-nums">{valeur}</dd>
            </div>
          ))}
        </dl>
      </header>

      {!ouvert && (
        <p role="status" className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          <strong>Fermé pour le moment.</strong> Vous pouvez consulter le menu, mais les commandes sont suspendues.
        </p>
      )}

      {categories.length > 1 && (
        <nav
          ref={navRef}
          aria-label="Catégories du menu"
          className="sticky top-14 z-20 -mx-4 flex gap-2 overflow-x-auto bg-background px-4 py-2.5 [scrollbar-width:none] md:top-17 md:mx-0 md:px-0"
        >
          {categories.map((categorie) => {
            const active = sectionActive === ancre(categorie);
            return (
              <a
                key={categorie}
                href={`#${ancre(categorie)}`}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap',
                  active ? 'bg-foreground text-background' : 'bg-card text-foreground shadow-(--shadow-carte) hover:bg-accent',
                )}
              >
                {categorie}
              </a>
            );
          })}
        </nav>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
        <div className="space-y-8">
          {[...platsParCategorie.entries()].map(([categorie, plats]) => (
            <section key={categorie} id={ancre(categorie)} className="scroll-mt-32">
              <h2 className="font-heading text-xl font-extrabold tracking-tight md:text-2xl">
                {categorie}{' '}
                <span className="font-sans text-sm font-medium text-muted-foreground">{plats.length}</span>
              </h2>

              <div className="carte mt-3 divide-y divide-border px-4">
                {plats.map((plat) => (
                  <PlatCard
                    key={plat.id}
                    plat={plat}
                    quantite={quantiteDe(plat.id)}
                    commandable={ouvert}
                    onAjouter={ajouterAuPanier}
                    onRetirer={(p) => updateQuantity(p.id, quantiteDe(p.id) - 1)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="lg:sticky lg:top-32">
          <BarrePanier items={itemsIci} />
        </div>
      </div>

      <Dialog open={conflictPlat !== null} onOpenChange={(open) => !open && setConflictPlat(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-extrabold">Vider le panier actuel ?</DialogTitle>
          </DialogHeader>
          <p className="text-[15px] text-muted-foreground">
            Votre panier contient des plats d'un autre restaurant. Une commande ChapExpress ne concerne qu'un seul restaurant à la fois.
          </p>
          <DialogFooter className="mt-3 gap-2 sm:gap-2">
            <Button variant="outline" className="h-11 font-bold" onClick={() => setConflictPlat(null)}>
              Garder l'ancien panier
            </Button>
            <Button
              className="h-11 font-bold"
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
