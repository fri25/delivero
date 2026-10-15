import { useState } from 'react';
import { TYPES_CUISINE } from '@delivero/config/types-cuisine';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useMonRestaurant, useUpdateMonRestaurant } from '@/api/restaurant';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/api/types';

function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const updateRestaurant = useUpdateMonRestaurant();

  const [nom, setNom] = useState(restaurant.nom);
  const [description, setDescription] = useState(restaurant.description ?? '');
  const [horaires, setHoraires] = useState(restaurant.horaires ?? '');
  const [specialiteCuisine, setSpecialiteCuisine] = useState(restaurant.specialiteCuisine ?? '');
  const [typesCuisine, setTypesCuisine] = useState<string[]>(restaurant.typesCuisine ?? []);
  const [delai, setDelai] = useState(
    (restaurant.delaiPreparationMin ?? restaurant.delaiMoyenMinutes)?.toString() ?? '',
  );

  return (
    <form
      className="space-y-5 rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs"
      onSubmit={(event) => {
        event.preventDefault();
        updateRestaurant.mutate(
          {
            nom: nom.trim(),
            description: description.trim() || undefined,
            horaires: horaires.trim() || undefined,
            specialiteCuisine: specialiteCuisine.trim() || undefined,
            delaiMoyenMinutes: delai ? Number(delai) : undefined,
            typesCuisine,
            delaiPreparationMin: delai ? Number(delai) : undefined,
          },
          {
            onSuccess: () => toast.success('Fiche restaurant mise à jour avec succès.'),
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="border-b border-border/60 pb-3">
        <h2 className="font-heading text-lg font-bold text-foreground">Profil de l'établissement</h2>
        <p className="text-xs text-muted-foreground">Ces informations sont visibles par les clients sur l'application.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nom" className="text-xs font-semibold">Nom du restaurant *</Label>
        <Input id="nom" value={nom} onChange={(event) => setNom(event.target.value)} required className="rounded-xl" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-semibold">Description / spécialité</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-xl text-sm"
          rows={2}
          placeholder="Ex. Grillades de poissons et spécialités locales du Bénin"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="horaires" className="text-xs font-semibold">Horaires d'ouverture</Label>
        <Textarea
          id="horaires"
          placeholder="ex. Tous les jours 11h00–22h30"
          value={horaires}
          onChange={(event) => setHoraires(event.target.value)}
          className="rounded-xl text-sm"
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="specialiteCuisine" className="text-xs font-semibold">Spécialité principale</Label>
        <Input
          id="specialiteCuisine"
          value={specialiteCuisine}
          onChange={(event) => setSpecialiteCuisine(event.target.value)}
          placeholder="Cuisine béninoise, grillades…"
          className="rounded-xl"
        />
      </div>

      {/* Filtres du catalogue client (F-CLI-11). */}
      <fieldset className="space-y-2.5">
        <legend className="text-xs font-semibold text-foreground">Catégories & Types de cuisine</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES_CUISINE.map((cuisine) => {
            const coche = typesCuisine.includes(cuisine);
            return (
              <button
                key={cuisine}
                type="button"
                aria-pressed={coche}
                onClick={() =>
                  setTypesCuisine(coche ? typesCuisine.filter((t) => t !== cuisine) : [...typesCuisine, cuisine])
                }
                className={cn(
                  'h-8.5 rounded-full px-3.5 text-xs font-semibold transition-all active:scale-95 shadow-2xs',
                  coche
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60',
                )}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="delai" className="text-xs font-semibold">Délai moyen de préparation (minutes)</Label>
        <Input
          id="delai"
          type="number"
          inputMode="numeric"
          min={10}
          max={240}
          value={delai}
          onChange={(event) => setDelai(event.target.value)}
          placeholder="Ex. 35"
          className="rounded-xl font-mono max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          Indiquez un délai moyen réaliste. Il sera affiché aux clients avant leur commande.
        </p>
      </div>

      <div className="pt-2 border-t border-border/60">
        <Button
          type="submit"
          disabled={updateRestaurant.isPending}
          className="h-11 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white px-6 shadow-sm active:scale-98 transition-all"
        >
          {updateRestaurant.isPending ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  );
}

export function SettingsPage() {
  const { data: restaurant, isPending } = useMonRestaurant();

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (!restaurant) {
    return <p className="text-sm text-destructive">Restaurant introuvable.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Réglages du restaurant</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configurez les paramètres de votre établissement et vos informations ChapExpress.</p>
      </div>

      <SettingsForm key={restaurant.id} restaurant={restaurant} />

      <div className="space-y-2 rounded-3xl border border-border/70 bg-muted/40 p-4 sm:p-5 text-sm">
        <p className="font-heading font-bold text-foreground">Conditions partenaires ChapExpress</p>
        <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Taux de commission :</span>{' '}
            {restaurant.tauxCommission ? `${restaurant.tauxCommission} %` : '—'} sur chaque commande,
            prélevée sur le client (conformément à votre convention de partenariat).
          </p>
          {restaurant.noteMoyenne && (
            <p>
              <span className="font-medium text-foreground">Note moyenne clients :</span> ⭐ {restaurant.noteMoyenne} / 5
            </p>
          )}
          <p>
            L'interrupteur « Ouvert / Fermé » situé dans la barre supérieure active ou suspend instantanément la réception des commandes.
          </p>
        </div>
      </div>
    </div>
  );
}
