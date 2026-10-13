import { useState, type ComponentProps } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoneSelect } from '@/components/zones/ZoneSelect';
import {
  useCreatePartenaire,
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
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {aide && <p className="text-xs text-muted-foreground">{aide}</p>}
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
      className="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
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
      <div>
        <h2 className="font-heading font-semibold">Nouveau restaurant</h2>
        <p className="text-sm text-muted-foreground">
          Crée le restaurant et son compte de connexion à l’application Partenaires. Transmettez le numéro et le mot de
          passe au restaurant.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Champ id="resto-nom" label="Nom du restaurant" value={nom} onChange={(e) => setNom(e.target.value)} required minLength={2} />
        <div className="space-y-1.5">
          <Label htmlFor="resto-zone">Zone</Label>
          <ZoneSelect id="resto-zone" value={zoneId} onChange={setZoneId} />
        </div>
        <Champ
          id="resto-telephone"
          label="Téléphone de connexion"
          placeholder="01 57 86 69 59"
          inputMode="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          required
        />
        <Champ
          id="resto-mdp"
          label="Mot de passe provisoire"
          aide="8 caractères minimum."
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
          minLength={8}
        />
        <Champ
          id="resto-repere"
          label="Point de repère"
          aide="Obligatoire : c’est ce que lit le livreur pour trouver le restaurant."
          placeholder="ex. Face à la station Total, portail vert"
          value={pointDeRepere}
          onChange={(e) => setPointDeRepere(e.target.value)}
          required
          minLength={3}
        />
        <Champ id="resto-adresse" label="Adresse (facultatif)" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={creer.isPending}>
          {creer.isPending ? 'Création…' : 'Créer le restaurant'}
        </Button>
        <Button type="button" variant="ghost" onClick={onTermine}>
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
      className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2"
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
        <Label htmlFor={`zone-${restaurant.id}`}>Zone</Label>
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
        aide="Seulement si le restaurant a perdu le sien. Laissez vide sinon."
        value={motDePasse}
        onChange={(e) => setMotDePasse(e.target.value)}
        minLength={8}
      />
      <div className="flex items-end gap-2">
        <Button type="submit" disabled={modifier.isPending}>
          Enregistrer
        </Button>
        <Button type="button" variant="ghost" onClick={onTermine}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function CarteRestaurant({ restaurant }: { restaurant: PartenaireAdmin }) {
  const [edition, setEdition] = useState(false);
  const suspendre = useSuspendrePartenaire();

  return (
    <li className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading font-semibold">{restaurant.nom}</h3>
            {restaurant.suspendu ? (
              <Badge variant="destructive">Suspendu</Badge>
            ) : restaurant.statutOuverture ? (
              <Badge className="bg-success text-white">Ouvert</Badge>
            ) : (
              <Badge variant="outline">Fermé</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Connexion : <span className="font-medium text-foreground">{restaurant.user.telephone}</span> · Zone{' '}
            {restaurant.zone.nom}
          </p>
          <p className="text-sm">
            {restaurant.pointDeRepere ?? <span className="text-destructive">Point de repère manquant</span>}
            {restaurant.adresse && <span className="text-muted-foreground"> · {restaurant.adresse}</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {restaurant._count.plats} plat{restaurant._count.plats > 1 ? 's' : ''} · {restaurant._count.commandesRepas}{' '}
            commande{restaurant._count.commandesRepas > 1 ? 's' : ''} au total
            {restaurant.noteMoyenne && ` · ${Number(restaurant.noteMoyenne).toFixed(1)} / 5`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!edition && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEdition(true)}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Modifier
            </Button>
          )}
          <Button
            size="sm"
            variant={restaurant.suspendu ? 'default' : 'outline'}
            className={restaurant.suspendu ? '' : 'text-destructive hover:bg-destructive/10 hover:text-destructive'}
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Restaurants</h1>
          <p className="text-sm text-muted-foreground">
            Comptes partenaires, points de repère et suspension. Le menu et l’ouverture sont gérés par chaque restaurant.
          </p>
        </div>
        {!creation && (
          <Button className="gap-1.5" onClick={() => setCreation(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Nouveau restaurant
          </Button>
        )}
      </div>

      {creation && <NouveauRestaurantForm onTermine={() => setCreation(false)} />}

      {isPending ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : isError ? (
        <p className="text-sm text-destructive">Impossible de charger les restaurants.</p>
      ) : restaurants.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun restaurant pour l’instant.</p>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {restaurants.map((restaurant) => (
            <CarteRestaurant key={restaurant.id} restaurant={restaurant} />
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Commission Repas : 15 % facturés au client sur (plats + livraison), le restaurant est payé au prix de son menu
        (RG-08).
      </p>
    </div>
  );
}
