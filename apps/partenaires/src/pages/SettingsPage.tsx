import { useState } from 'react';
import { TYPES_CUISINE } from '@delivero/config/types-cuisine';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useMonRestaurant, useUpdateMonRestaurant } from '@/api/restaurant';
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
      className="space-y-4"
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
            onSuccess: () => toast.success('Fiche restaurant mise à jour.'),
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="nom">Nom du restaurant</Label>
        <Input id="nom" value={nom} onChange={(event) => setNom(event.target.value)} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description / spécialité</Label>
        <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="horaires">Horaires</Label>
        <Textarea
          id="horaires"
          placeholder="ex. Tous les jours 11h00–22h30"
          value={horaires}
          onChange={(event) => setHoraires(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="specialiteCuisine">Cuisine / spécialité</Label>
        <Input
          id="specialiteCuisine"
          value={specialiteCuisine}
          onChange={(event) => setSpecialiteCuisine(event.target.value)}
          placeholder="Cuisine béninoise, grillades…"
        />
      </div>

      {/* Filtres du catalogue client (F-CLI-11). */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Types de cuisine</legend>
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
                className={
                  coche
                    ? 'h-9 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground'
                    : 'h-9 rounded-full bg-secondary px-3.5 text-sm font-medium text-secondary-foreground'
                }
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="delai">Délai moyen de préparation (minutes)</Label>
        <Input
          id="delai"
          type="number"
          inputMode="numeric"
          min={10}
          max={240}
          value={delai}
          onChange={(event) => setDelai(event.target.value)}
          placeholder="Ex. 35"
        />
        <p className="text-xs text-muted-foreground">
          Indiquez un délai moyen réaliste. Il sera affiché aux clients avant commande.
        </p>
      </div>

      <Button type="submit" disabled={updateRestaurant.isPending}>
        {updateRestaurant.isPending ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </form>
  );
}

export function SettingsPage() {
  const { data: restaurant, isPending } = useMonRestaurant();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!restaurant) {
    return <p className="text-sm text-destructive">Restaurant introuvable.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Paramètres</h1>

      <SettingsForm key={restaurant.id} restaurant={restaurant} />

      <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="font-medium">Informations fixées par ChapExpress</p>
        <p className="text-muted-foreground">
          Commission :{' '}
          {restaurant.tauxCommission ? `${restaurant.tauxCommission} %` : '—'} sur chaque commande,
          prélevée sur le client (voir votre convention de partenariat).
        </p>
        {restaurant.noteMoyenne && (
          <p className="text-muted-foreground">Note moyenne : {restaurant.noteMoyenne} / 5</p>
        )}
        <p className="text-muted-foreground">
          Pour rappel, l'ouverture/fermeture du restaurant se change directement depuis l'en-tête —
          les commandes ne sont proposées aux clients que si le restaurant est marqué « Ouvert ».
        </p>
      </div>
    </div>
  );
}
