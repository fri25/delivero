import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateLivreur, useLivreurs, useUpdateLivreur } from '@/api/livreurs';
import { useZones } from '@/api/zones';
import { formatPrixFcfa } from '@/lib/format';
import type { Livreur } from '@/api/types';

function ZoneSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const { data: zones } = useZones();
  return (
    <select
      id={id}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    >
      <option value="" disabled>
        Choisir une zone
      </option>
      {zones?.map((zone) => (
        <option key={zone.id} value={zone.id}>
          {zone.nom}
        </option>
      ))}
    </select>
  );
}

function NouveauLivreurForm() {
  const createLivreur = useCreateLivreur();
  const [ouvert, setOuvert] = useState(false);
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nom, setNom] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [plafondAvance, setPlafondAvance] = useState('');
  const [plafondCaisse, setPlafondCaisse] = useState('');

  if (!ouvert) {
    return (
      <Button size="sm" onClick={() => setOuvert(true)}>
        Nouveau livreur
      </Button>
    );
  }

  return (
    <form
      className="grid gap-3 rounded-xl p-4 ring-1 ring-foreground/10 sm:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        createLivreur.mutate(
          {
            telephone,
            motDePasse,
            nom,
            zoneId,
            plafondAvance: Number(plafondAvance),
            plafondCaisse: Number(plafondCaisse),
          },
          {
            onSuccess: () => {
              toast.success('Livreur créé.');
              setOuvert(false);
              setTelephone('');
              setMotDePasse('');
              setNom('');
              setZoneId('');
              setPlafondAvance('');
              setPlafondCaisse('');
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="livreur-nom">Nom</Label>
        <Input id="livreur-nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="livreur-telephone">Téléphone</Label>
        <Input
          id="livreur-telephone"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          placeholder="+22900000000"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="livreur-mdp">Mot de passe provisoire</Label>
        <Input
          id="livreur-mdp"
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="livreur-zone">Zone</Label>
        <ZoneSelect id="livreur-zone" value={zoneId} onChange={setZoneId} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="livreur-plafond-avance">Plafond d'avance (FCFA)</Label>
        <Input
          id="livreur-plafond-avance"
          type="number"
          min="0"
          value={plafondAvance}
          onChange={(e) => setPlafondAvance(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="livreur-plafond-caisse">Plafond de caisse (FCFA)</Label>
        <Input
          id="livreur-plafond-caisse"
          type="number"
          min="0"
          value={plafondCaisse}
          onChange={(e) => setPlafondCaisse(e.target.value)}
          required
        />
      </div>
      <div className="flex items-end gap-2 sm:col-span-3">
        <Button type="submit" size="sm" disabled={createLivreur.isPending}>
          Créer
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOuvert(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function LivreurRow({ livreur }: { livreur: Livreur }) {
  const updateLivreur = useUpdateLivreur();
  const [edition, setEdition] = useState(false);
  const [zoneId, setZoneId] = useState(livreur.zone.id);
  const [plafondAvance, setPlafondAvance] = useState(livreur.plafondAvance);
  const [plafondCaisse, setPlafondCaisse] = useState(livreur.plafondCaisse);

  if (!edition) {
    return (
      <tr className="border-t border-border">
        <td className="px-3 py-2">
          <div className="font-medium">{livreur.user.nom}</div>
          <div className="text-xs text-muted-foreground">{livreur.user.telephone}</div>
        </td>
        <td className="px-3 py-2">
          <Badge variant={livreur.disponible ? 'default' : 'outline'}>
            {livreur.disponible ? 'Disponible' : 'Indisponible'}
          </Badge>
        </td>
        <td className="px-3 py-2">{livreur.zone.nom}</td>
        <td className="px-3 py-2">{formatPrixFcfa(livreur.plafondAvance)}</td>
        <td className="px-3 py-2">{formatPrixFcfa(livreur.plafondCaisse)}</td>
        <td className="px-3 py-2">{formatPrixFcfa(livreur.avanceEnCours)}</td>
        <td className="px-3 py-2">{formatPrixFcfa(livreur.caisseAReverser)}</td>
        <td className="px-3 py-2">
          <Button size="sm" variant="outline" onClick={() => setEdition(true)}>
            Modifier
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border bg-muted/30">
      <td className="px-3 py-2">
        <div className="font-medium">{livreur.user.nom}</div>
        <div className="text-xs text-muted-foreground">{livreur.user.telephone}</div>
      </td>
      <td className="px-3 py-2">
        <Badge variant={livreur.disponible ? 'default' : 'outline'}>
          {livreur.disponible ? 'Disponible' : 'Indisponible'}
        </Badge>
      </td>
      <td className="px-3 py-2">
        <ZoneSelect value={zoneId} onChange={setZoneId} />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min="0"
          className="h-7 w-28"
          value={plafondAvance}
          onChange={(e) => setPlafondAvance(e.target.value)}
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min="0"
          className="h-7 w-28"
          value={plafondCaisse}
          onChange={(e) => setPlafondCaisse(e.target.value)}
        />
      </td>
      <td className="px-3 py-2 text-muted-foreground">{formatPrixFcfa(livreur.avanceEnCours)}</td>
      <td className="px-3 py-2 text-muted-foreground">{formatPrixFcfa(livreur.caisseAReverser)}</td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={updateLivreur.isPending}
            onClick={() => {
              updateLivreur.mutate(
                {
                  id: livreur.id,
                  dto: {
                    zoneId,
                    plafondAvance: Number(plafondAvance),
                    plafondCaisse: Number(plafondCaisse),
                  },
                },
                {
                  onSuccess: () => {
                    toast.success('Livreur mis à jour.');
                    setEdition(false);
                  },
                  onError: (error) => toast.error(error.message),
                },
              );
            }}
          >
            Enregistrer
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEdition(false)}>
            Annuler
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function LivreursPage() {
  const { data: livreurs, isPending } = useLivreurs();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Livreurs</h1>
        <p className="text-sm text-muted-foreground">
          Enregistrement, zone et plafonds d'avance/de caisse (F-ADM-09). Avance en cours et
          solde à reverser (F-LIV-09) sont calculés en direct depuis les commandes et
          encaissements. La gestion des pièces d'identité et les statistiques de performance
          restent hors périmètre (pas de stockage de fichiers).
        </p>
      </div>

      <NouveauLivreurForm />

      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : !livreurs || livreurs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun livreur.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Livreur</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Zone</th>
                <th className="px-3 py-2 font-medium">Plafond avance</th>
                <th className="px-3 py-2 font-medium">Plafond caisse</th>
                <th className="px-3 py-2 font-medium">Avance en cours</th>
                <th className="px-3 py-2 font-medium">Solde à reverser</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {livreurs.map((livreur) => (
                <LivreurRow key={livreur.id} livreur={livreur} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
