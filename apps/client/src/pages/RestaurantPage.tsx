import { useState } from 'react';
import { Clock, Star, UtensilsCrossed } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRestaurant } from '@/api/restaurants';
import { useCartStore } from '@/stores/cart-store';
import { PlatCard } from '@/components/restaurants/PlatCard';
import type { Plat } from '@/api/types';

export function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const { data: restaurant, isPending } = useRestaurant(id);
  const addItem = useCartStore((state) => state.addItem);
  const hasConflict = useCartStore((state) => state.hasConflict);
  const [conflictPlat, setConflictPlat] = useState<Plat | null>(null);

  const ajouterAuPanier = (plat: Plat) => {
    if (!restaurant) return;

    if (hasConflict(restaurant.id)) {
      setConflictPlat(plat);
      return;
    }

    addItem(restaurant.id, restaurant.nom, {
      platId: plat.id,
      nom: plat.nom,
      prixUnitaire: Number(plat.prix),
      quantite: 1,
    });
    toast.success(`${plat.nom} ajouté au panier`);
  };

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
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

  return (
    <div className="space-y-6">
      <div className="-mx-4 -mt-6 overflow-hidden rounded-b-2xl bg-gradient-to-br from-brand-blue to-brand-navy px-4 pt-6 pb-4 text-white sm:mx-0 sm:mt-0 sm:rounded-2xl sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15">
              <UtensilsCrossed className="size-6" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-semibold">{restaurant.nom}</h1>
              {restaurant.description && <p className="text-sm text-white/80">{restaurant.description}</p>}
            </div>
          </div>
          <Badge
            variant="secondary"
            className={restaurant.statutOuverture ? 'bg-success text-success-foreground' : undefined}
          >
            {restaurant.statutOuverture ? 'Ouvert' : 'Fermé'}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/85">
          {restaurant.horaires && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {restaurant.horaires}
            </span>
          )}
          {restaurant.noteMoyenne && (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-brand-green text-brand-green" />
              {restaurant.noteMoyenne}
            </span>
          )}
        </div>
      </div>

      {[...platsParCategorie.entries()].map(([categorie, plats]) => (
        <section key={categorie}>
          <h2 className="mb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{categorie}</h2>
          <div>
            {plats.map((plat) => (
              <PlatCard key={plat.id} plat={plat} onAjouter={ajouterAuPanier} />
            ))}
          </div>
        </section>
      ))}

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
                if (!conflictPlat || !restaurant) return;
                addItem(restaurant.id, restaurant.nom, {
                  platId: conflictPlat.id,
                  nom: conflictPlat.nom,
                  prixUnitaire: Number(conflictPlat.prix),
                  quantite: 1,
                });
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
