import { useRef, useState } from 'react';
import { TYPES_CUISINE } from '@delivero/config/types-cuisine';
import { Camera, Loader2, Store, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useMonRestaurant, useUpdateMonRestaurant } from '@/api/restaurant';
import { envoyerPhoto, miniature } from '@/lib/medias';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/api/types';
import { useEntreprise } from '@/lib/entreprise';

function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const updateRestaurant = useUpdateMonRestaurant();

  const [nom, setNom] = useState(restaurant.nom);
  const [logoUrl, setLogoUrl] = useState<string | null>(restaurant.logoUrl);
  const [envoiLogo, setEnvoiLogo] = useState(false);
  const inputLogo = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState(restaurant.description ?? '');
  const [horaires, setHoraires] = useState(restaurant.horaires ?? '');
  const [specialiteCuisine, setSpecialiteCuisine] = useState(restaurant.specialiteCuisine ?? '');
  const [typesCuisine, setTypesCuisine] = useState<string[]>(restaurant.typesCuisine ?? []);
  const [delai, setDelai] = useState(
    (restaurant.delaiPreparationMin ?? restaurant.delaiMoyenMinutes)?.toString() ?? '',
  );

  const handleLogo = async (fichier: File) => {
    setEnvoiLogo(true);
    try {
      setLogoUrl(await envoyerPhoto(fichier, 'logos'));
      toast.success('Logo prêt. Enregistrez pour le publier.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Envoi du logo impossible.');
    } finally {
      setEnvoiLogo(false);
      if (inputLogo.current) inputLogo.current.value = '';
    }
  };

  return (
    <form
      className="carte space-y-5 p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (envoiLogo) {
          toast.error('Veuillez patienter pendant l’envoi du logo.');
          return;
        }
        updateRestaurant.mutate(
          {
            nom: nom.trim(),
            logoUrl: logoUrl ?? '',
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
        <h2 className="text-lg font-bold">Profil de l'établissement</h2>
        <p className="text-xs text-muted-foreground">Ces informations sont visibles par les clients sur l'application.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Logo du restaurant</Label>
        <input
          ref={inputLogo}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const fichier = event.target.files?.[0];
            if (fichier) void handleLogo(fichier);
          }}
        />
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {logoUrl ? (
              <img
                src={miniature(logoUrl, 192)}
                alt="Logo du restaurant"
                className="size-20 rounded-xl bg-white object-contain ring-1 ring-border"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-xl bg-muted">
                <Store className="size-8 text-muted-foreground" aria-hidden="true" />
              </div>
            )}
            {logoUrl && !envoiLogo && (
              <button
                type="button"
                onClick={() => setLogoUrl(null)}
                className="absolute -right-2 -top-2 rounded-full bg-foreground p-1 text-background hover:opacity-90"
                title="Retirer le logo"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={envoiLogo}
              onClick={() => inputLogo.current?.click()}
              className="flex h-10 items-center gap-2 rounded-xl text-xs font-medium"
            >
              {envoiLogo ? (
                <>
                  <Loader2 className="size-4 animate-spin text-primary" />
                  Optimisation et envoi...
                </>
              ) : (
                <>
                  <Camera className="size-4" />
                  {logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">Image carrée de préférence, affichée aux clients.</p>
          </div>
        </div>
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
                  'h-10 rounded-full px-4 text-sm font-semibold',
                  coche
                    ? 'bg-foreground text-background font-bold'
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
          className="rounded-xl tabular-nums max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          Indiquez un délai moyen réaliste. Il sera affiché aux clients avant leur commande.
        </p>
      </div>

      <div className="pt-2 border-t border-border/60">
        <Button
          type="submit"
          disabled={updateRestaurant.isPending || envoiLogo}
          className="h-12 rounded-xl px-6 text-base font-bold"
        >
          {updateRestaurant.isPending ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  );
}

export function SettingsPage() {
  const entreprise = useEntreprise();
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
        <h1 className="titre-page">Réglages du restaurant</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configurez les paramètres de votre établissement et vos informations {entreprise.nomCommercial}.</p>
      </div>

      <SettingsForm key={restaurant.id} restaurant={restaurant} />

      <div className="carte space-y-2 p-4 text-sm sm:p-5">
        <p className="font-bold">Conditions partenaires {entreprise.nomCommercial}</p>
        <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Taux de commission :</span>{' '}
            {restaurant.tauxCommission ? `${restaurant.tauxCommission} %` : '—'} sur chaque commande,
            prélevée sur le client (conformément à votre convention de partenariat).
          </p>
          {restaurant.noteMoyenne && (
            <p>
              <span className="font-medium text-foreground">Note moyenne clients :</span> {restaurant.noteMoyenne} / 5
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
