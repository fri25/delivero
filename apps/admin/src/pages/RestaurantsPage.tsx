import { useState, type ComponentProps } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoneSelect } from '@/components/zones/ZoneSelect';
import {
  useCreatePartenaire,
  useDeletePartenaire,
  usePartenaires,
  useSuspendrePartenaire,
  useUpdatePartenaire,
} from '@/api/partenaires';
import type { PartenaireAdmin } from '@/api/types';

function Champ({
  id,
  label,
  aide,
  ...props
}: { id: string; label: string; aide?: string } & ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">{label}</Label>
      <Input id={id} className="rounded-xl" {...props} />
      {aide && <p className="text-[11px] text-muted-foreground">{aide}</p>}
    </div>
  );
}

function NouveauRestaurantForm({ onTermine }: { onTermine: () => void }) {
  const creer = useCreatePartenaire();
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [pointDeRepere, setPointDeRepere] = useState('');
  const [adresse, setAdresse] = useState('');

  return (
    <form
      className="space-y-5 rounded-3xl border border-primary/30 bg-card p-5 sm:p-6 shadow-md"
      onSubmit={(event) => {
        event.preventDefault();
        creer.mutate(
          {
            nom: nom.trim(),
            telephone: telephone.trim(),
            motDePasse,
            zoneId,
            pointDeRepere: pointDeRepere.trim(),
            adresse: adresse.trim() || undefined,
          },
          {
            onSuccess: (restaurant) => {
              toast.success(
                `${restaurant.nom} créé. Connexion : ${restaurant.user.telephone}. Il est fermé jusqu’à ce qu’il s’ouvre lui-même.`,
                { duration: 10_000 },
              );
              onTermine();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="border-b border-border/60 pb-3">
        <h2 className="font-heading text-lg font-bold text-foreground">Nouveau restaurant partenaire</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Crée la fiche établissement et les identifiants de connexion à l’application Partenaires.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ id="resto-nom" label="Nom du restaurant *" value={nom} onChange={(e) => setNom(e.target.value)} required minLength={2} />
        <div className="space-y-1.5">
          <Label htmlFor="resto-zone" className="text-xs font-semibold">Zone de livraison *</Label>
          <ZoneSelect id="resto-zone" value={zoneId} onChange={setZoneId} />
        </div>
        <Champ
          id="resto-telephone"
          label="Téléphone de connexion *"
          placeholder="01 57 86 69 59"
          inputMode="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          required
        />
        <Champ
          id="resto-mdp"
          label="Mot de passe provisoire *"
          aide="8 caractères minimum."
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
          minLength={8}
        />
        <Champ
          id="resto-repere"
          label="Point de repère *"
          aide="Obligatoire : description visuelle pour le livreur."
          placeholder="ex. Face à la station Total, portail vert"
          value={pointDeRepere}
          onChange={(e) => setPointDeRepere(e.target.value)}
          required
          minLength={3}
        />
        <Champ id="resto-adresse" label="Adresse (facultatif)" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
      </div>
      <div className="flex gap-2 pt-2 border-t border-border/60">
        <Button
          type="submit"
          disabled={creer.isPending}
          className="h-11 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm active:scale-98 transition-all px-6"
        >
          {creer.isPending ? 'Création en cours…' : 'Créer le restaurant'}
        </Button>
        <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={onTermine}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function ModifierRestaurantForm({ restaurant, onTermine }: { restaurant: PartenaireAdmin; onTermine: () => void }) {
  const modifier = useUpdatePartenaire();
  const [nom, setNom] = useState(restaurant.nom);
  const [zoneId, setZoneId] = useState(restaurant.zone.id);
  const [pointDeRepere, setPointDeRepere] = useState(restaurant.pointDeRepere ?? '');
  const [adresse, setAdresse] = useState(restaurant.adresse ?? '');
  const [motDePasse, setMotDePasse] = useState('');

  return (
    <form
      className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        modifier.mutate(
          {
            id: restaurant.id,
            dto: {
              nom: nom.trim(),
              zoneId,
              pointDeRepere: pointDeRepere.trim(),
              adresse: adresse.trim(),
              motDePasse: motDePasse || undefined,
            },
          },
          {
            onSuccess: () => {
              toast.success(motDePasse ? 'Restaurant modifié, nouveau mot de passe enregistré.' : 'Restaurant modifié.');
              onTermine();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <Champ id={`nom-${restaurant.id}`} label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required minLength={2} />
      <div className="space-y-1.5">
        <Label htmlFor={`zone-${restaurant.id}`} className="text-xs font-semibold">Zone</Label>
        <ZoneSelect id={`zone-${restaurant.id}`} value={zoneId} onChange={setZoneId} />
      </div>
      <Champ
        id={`repere-${restaurant.id}`}
        label="Point de repère"
        value={pointDeRepere}
        onChange={(e) => setPointDeRepere(e.target.value)}
        required
        minLength={3}
      />
      <Champ id={`adresse-${restaurant.id}`} label="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
      <Champ
        id={`mdp-${restaurant.id}`}
        label="Nouveau mot de passe"
        aide="Laisser vide si inchangé."
        value={motDePasse}
        onChange={(e) => setMotDePasse(e.target.value)}
        minLength={8}
      />
      <div className="flex items-end gap-2 sm:col-span-2 pt-2">
        <Button type="submit" disabled={modifier.isPending} className="h-10 rounded-xl font-bold bg-primary text-white">
          {modifier.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <Button type="button" variant="ghost" className="h-10 rounded-xl" onClick={onTermine}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function CarteRestaurant({ restaurant }: { restaurant: PartenaireAdmin }) {
  const [edition, setEdition] = useState(false);
  const suspendre = useSuspendrePartenaire();
  const supprimer = useDeletePartenaire();

  return (
    <li className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading font-bold text-base text-foreground">{restaurant.nom}</h3>
            {restaurant.suspendu ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 px-2.5 py-0.5 text-xs font-bold">
                <span className="size-1.5 rounded-full bg-destructive" />
                Suspendu
              </span>
            ) : restaurant.statutOuverture ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ouvert
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Fermé
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Connexion : <a href={`tel:${restaurant.user.telephone}`} className="font-mono font-medium text-foreground hover:text-primary transition-colors">{restaurant.user.telephone}</a> · Zone <span className="font-medium text-foreground">{restaurant.zone.nom}</span>
          </p>
          <p className="text-xs text-foreground/90">
            {restaurant.pointDeRepere ? (
              <span>📍 {restaurant.pointDeRepere}</span>
            ) : (
              <span className="text-destructive font-semibold">Point de repère manquant</span>
            )}
            {restaurant.adresse && <span className="text-muted-foreground"> · {restaurant.adresse}</span>}
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-muted-foreground font-medium">
            <span className="rounded-lg bg-muted px-2 py-0.5 font-bold text-foreground">
              {restaurant._count.plats} plat{restaurant._count.plats > 1 ? 's' : ''}
            </span>
            <span className="rounded-lg bg-muted px-2 py-0.5 font-bold text-foreground">
              {restaurant._count.commandesRepas} commande{restaurant._count.commandesRepas > 1 ? 's' : ''}
            </span>
            {restaurant.noteMoyenne && (
              <span className="rounded-lg bg-amber-500/10 text-amber-700 px-2 py-0.5 font-bold">
                ⭐ {Number(restaurant.noteMoyenne).toFixed(1)} / 5
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {!edition && (
            <Button size="sm" variant="outline" className="h-8.5 gap-1.5 rounded-xl text-xs font-semibold" onClick={() => setEdition(true)}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Modifier
            </Button>
          )}
          <Button
            size="sm"
            variant={restaurant.suspendu ? 'default' : 'outline'}
            className={cn(
              'h-8.5 rounded-xl text-xs font-bold transition-all',
              restaurant.suspendu
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive',
            )}
            disabled={suspendre.isPending}
            onClick={() => {
              if (
                !restaurant.suspendu &&
                !window.confirm(
                  `Suspendre ${restaurant.nom} ? Il disparaît de l’application client et ne reçoit plus de commandes. Les commandes déjà passées continuent.`,
                )
              ) {
                return;
              }
              suspendre.mutate(
                { id: restaurant.id, suspendu: !restaurant.suspendu },
                {
                  onSuccess: (resultat) =>
                    toast.success(resultat.suspendu ? `${resultat.nom} est suspendu.` : `${resultat.nom} est réactivé.`),
                  onError: (error) => toast.error(error.message),
                },
              );
            }}
          >
            {restaurant.suspendu ? 'Réactiver' : 'Suspendre'}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Supprimer ce restaurant"
            aria-label={`Supprimer ${restaurant.nom}`}
            disabled={supprimer.isPending}
            onClick={() => {
              if (!window.confirm(`Supprimer définitivement ${restaurant.nom}, son accès et son menu ? Cette action est irréversible. Les restaurants associés à des commandes ne peuvent pas être supprimés.`)) {
                return;
              }
              supprimer.mutate(
                { id: restaurant.id },
                {
                  onSuccess: () => toast.success(`${restaurant.nom} a été supprimé.`),
                  onError: (error) => toast.error(error.message),
                },
              );
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      {edition && <ModifierRestaurantForm restaurant={restaurant} onTermine={() => setEdition(false)} />}
    </li>
  );
}

/**
 * F-ADM-08 — restaurants (the Commerce partenaire module does not exist yet).
 * No commission setting: for Repas the 15 % is billed to the client and the
 * restaurant is paid in full (RG-08).
 */
export function RestaurantsPage() {
  const { data: restaurants, isPending, isError } = usePartenaires();
  const [creation, setCreation] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Restaurants partenaires</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestion des fiches établissements, points de repère et contrôle des suspensions.
          </p>
        </div>
        {!creation && (
          <Button
            className="gap-2 rounded-full bg-primary px-4 font-bold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all self-start sm:self-auto"
            onClick={() => setCreation(true)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nouveau restaurant
          </Button>
        )}
      </div>

      {creation && <NouveauRestaurantForm onTermine={() => setCreation(false)} />}

      {isPending ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
          <p className="font-heading font-semibold text-base">Impossible de charger les restaurants</p>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-12 text-center shadow-xs">
          <p className="font-heading text-lg font-bold text-foreground">Aucun restaurant partenaire</p>
          <p className="mt-1 text-sm text-muted-foreground">Créez la première fiche restaurant pour ouvrir la commande en ligne.</p>
        </div>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {restaurants.map((restaurant) => (
            <CarteRestaurant key={restaurant.id} restaurant={restaurant} />
          ))}
        </ul>
      )}

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-xs text-muted-foreground">
        Commission Repas : 15 % facturés au client sur (plats + livraison). Le restaurant partenaire est payé
        au prix net de sa carte (RG-08).
      </div>
    </div>
  );
}
