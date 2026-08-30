import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useSaisieManuelleColis,
  useSaisieManuelleCoursesExpress,
  useSaisieManuelleEmplettes,
  useSaisieManuelleRepas,
} from '@/api/saisie-manuelle';
import { useRestaurant, useRestaurants } from '@/api/restaurants';
import { useZones } from '@/api/zones';
import type { TypeService } from '@/api/types';

const SERVICES: { value: TypeService; label: string }[] = [
  { value: 'repas', label: 'Repas' },
  { value: 'colis', label: 'Colis' },
  { value: 'emplettes', label: 'Emplettes' },
  { value: 'courses_express', label: 'Courses express' },
];

function ZoneSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
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

function ClientFields({
  clientNom,
  setClientNom,
  clientTelephone,
  setClientTelephone,
}: {
  clientNom: string;
  setClientNom: (v: string) => void;
  clientTelephone: string;
  setClientTelephone: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="client-nom">Nom de l'appelant</Label>
        <Input id="client-nom" value={clientNom} onChange={(e) => setClientNom(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="client-telephone">Téléphone de l'appelant</Label>
        <Input
          id="client-telephone"
          value={clientTelephone}
          onChange={(e) => setClientTelephone(e.target.value)}
          placeholder="+22900000000"
          required
        />
      </div>
    </>
  );
}

function FormRepas() {
  const saisir = useSaisieManuelleRepas();
  const { data: restaurants } = useRestaurants();
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [pointDeRepere, setPointDeRepere] = useState('');
  const [partenaireId, setPartenaireId] = useState('');
  const { data: restaurant } = useRestaurant(partenaireId || undefined);
  const [lignes, setLignes] = useState([{ platId: '', quantite: 1 }]);

  const reset = () => {
    setClientNom('');
    setClientTelephone('');
    setPointDeRepere('');
    setPartenaireId('');
    setLignes([{ platId: '', quantite: 1 }]);
  };

  return (
    <form
      className="grid gap-3 rounded-xl p-4 ring-1 ring-foreground/10 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        saisir.mutate(
          {
            clientNom,
            clientTelephone,
            pointDeRepere,
            partenaireId,
            modePaiement: 'especes',
            lignes: lignes.filter((l) => l.platId),
          },
          {
            onSuccess: () => {
              toast.success('Commande Repas créée.');
              reset();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <ClientFields
        clientNom={clientNom}
        setClientNom={setClientNom}
        clientTelephone={clientTelephone}
        setClientTelephone={setClientTelephone}
      />
      <div className="space-y-1.5">
        <Label htmlFor="repas-point-de-repere">Point de repère (livraison)</Label>
        <Input
          id="repas-point-de-repere"
          value={pointDeRepere}
          onChange={(e) => setPointDeRepere(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="repas-restaurant">Restaurant</Label>
        <select
          id="repas-restaurant"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={partenaireId}
          onChange={(e) => {
            setPartenaireId(e.target.value);
            setLignes([{ platId: '', quantite: 1 }]);
          }}
          required
        >
          <option value="" disabled>
            Choisir un restaurant
          </option>
          {restaurants?.map((resto) => (
            <option key={resto.id} value={resto.id}>
              {resto.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label>Plats</Label>
        {lignes.map((ligne, index) => (
          <div key={index} className="flex gap-2">
            <select
              className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={ligne.platId}
              onChange={(e) => {
                const platId = e.target.value;
                setLignes(lignes.map((l, i) => (i === index ? { ...l, platId } : l)));
              }}
              disabled={!restaurant}
              required
            >
              <option value="" disabled>
                Choisir un plat
              </option>
              {restaurant?.plats.map((plat) => (
                <option key={plat.id} value={plat.id}>
                  {plat.nom} ({plat.prix} FCFA)
                </option>
              ))}
            </select>
            <Input
              type="number"
              min="1"
              className="w-20"
              value={ligne.quantite}
              onChange={(e) => {
                const quantite = Number(e.target.value);
                setLignes(lignes.map((l, i) => (i === index ? { ...l, quantite } : l)));
              }}
            />
            {lignes.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLignes(lignes.filter((_, i) => i !== index))}
              >
                Retirer
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setLignes([...lignes, { platId: '', quantite: 1 }])}
        >
          + Ajouter un plat
        </Button>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={saisir.isPending}>
          Créer la commande Repas
        </Button>
      </div>
    </form>
  );
}

function FormColis() {
  const saisir = useSaisieManuelleColis();
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [pointDeRepereEnlevement, setPointDeRepereEnlevement] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [taille, setTaille] = useState<'petit' | 'moyen' | 'grand'>('petit');
  const [destinataireNom, setDestinataireNom] = useState('');
  const [destinataireTelephone, setDestinataireTelephone] = useState('');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [pointDeRepereLivraison, setPointDeRepereLivraison] = useState('');
  const [montantContreRemboursement, setMontantContreRemboursement] = useState('');

  return (
    <form
      className="grid gap-3 rounded-xl p-4 ring-1 ring-foreground/10 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        saisir.mutate(
          {
            clientNom,
            clientTelephone,
            pointDeRepereEnlevement,
            zoneId,
            taille,
            destinataireNom,
            destinataireTelephone,
            adresseLivraison,
            pointDeRepereLivraison,
            montantContreRemboursement: montantContreRemboursement
              ? Number(montantContreRemboursement)
              : undefined,
            modePaiement: 'especes',
            conditionsAcceptees: true,
          },
          {
            onSuccess: () => {
              toast.success('Commande Colis créée.');
              setClientNom('');
              setClientTelephone('');
              setPointDeRepereEnlevement('');
              setZoneId('');
              setDestinataireNom('');
              setDestinataireTelephone('');
              setAdresseLivraison('');
              setPointDeRepereLivraison('');
              setMontantContreRemboursement('');
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <ClientFields
        clientNom={clientNom}
        setClientNom={setClientNom}
        clientTelephone={clientTelephone}
        setClientTelephone={setClientTelephone}
      />
      <div className="space-y-1.5">
        <Label htmlFor="colis-enlevement">Point de repère (enlèvement)</Label>
        <Input
          id="colis-enlevement"
          value={pointDeRepereEnlevement}
          onChange={(e) => setPointDeRepereEnlevement(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="colis-zone">Zone</Label>
        <ZoneSelect id="colis-zone" value={zoneId} onChange={setZoneId} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="colis-taille">Taille</Label>
        <select
          id="colis-taille"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={taille}
          onChange={(e) => setTaille(e.target.value as 'petit' | 'moyen' | 'grand')}
        >
          <option value="petit">Petit</option>
          <option value="moyen">Moyen</option>
          <option value="grand">Grand</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="colis-cr">Contre-remboursement (FCFA, optionnel)</Label>
        <Input
          id="colis-cr"
          type="number"
          min="0"
          value={montantContreRemboursement}
          onChange={(e) => setMontantContreRemboursement(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="colis-dest-nom">Nom du destinataire</Label>
        <Input
          id="colis-dest-nom"
          value={destinataireNom}
          onChange={(e) => setDestinataireNom(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="colis-dest-tel">Téléphone du destinataire</Label>
        <Input
          id="colis-dest-tel"
          value={destinataireTelephone}
          onChange={(e) => setDestinataireTelephone(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="colis-adresse-livraison">Adresse de livraison</Label>
        <Input
          id="colis-adresse-livraison"
          value={adresseLivraison}
          onChange={(e) => setAdresseLivraison(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="colis-point-livraison">Point de repère (livraison)</Label>
        <Input
          id="colis-point-livraison"
          value={pointDeRepereLivraison}
          onChange={(e) => setPointDeRepereLivraison(e.target.value)}
          required
        />
      </div>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Le rappel des objets interdits au transport doit être lu à l'appelant avant validation
        (RG-16) ; la case d'acceptation est cochée automatiquement pour cette saisie.
      </p>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saisir.isPending}>
          Créer la commande Colis
        </Button>
      </div>
    </form>
  );
}

function FormEmplettes() {
  const saisir = useSaisieManuelleEmplettes();
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [pointDeRepere, setPointDeRepere] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [articles, setArticles] = useState(['']);

  const reset = () => {
    setClientNom('');
    setClientTelephone('');
    setPointDeRepere('');
    setZoneId('');
    setBudgetMax('');
    setArticles(['']);
  };

  return (
    <form
      className="grid gap-3 rounded-xl p-4 ring-1 ring-foreground/10 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        saisir.mutate(
          {
            clientNom,
            clientTelephone,
            pointDeRepere,
            mode: 'liste_libre',
            zoneId,
            budgetMax: Number(budgetMax),
            modeFinancement: 'especes_livraison',
            articles: articles.filter((a) => a.trim()).map((libelle) => ({ libelle })),
          },
          {
            onSuccess: () => {
              toast.success('Commande Emplettes créée.');
              reset();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <ClientFields
        clientNom={clientNom}
        setClientNom={setClientNom}
        clientTelephone={clientTelephone}
        setClientTelephone={setClientTelephone}
      />
      <div className="space-y-1.5">
        <Label htmlFor="emplettes-point-de-repere">Point de repère (livraison)</Label>
        <Input
          id="emplettes-point-de-repere"
          value={pointDeRepere}
          onChange={(e) => setPointDeRepere(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="emplettes-zone">Zone</Label>
        <ZoneSelect id="emplettes-zone" value={zoneId} onChange={setZoneId} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="emplettes-budget">Budget maximum (FCFA)</Label>
        <Input
          id="emplettes-budget"
          type="number"
          min="0"
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label>Liste de courses (mode liste libre, financement espèces à la livraison)</Label>
        {articles.map((article, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={article}
              onChange={(e) => {
                const next = [...articles];
                next[index] = e.target.value;
                setArticles(next);
              }}
              placeholder="ex. 2kg de riz"
            />
            {articles.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setArticles(articles.filter((_, i) => i !== index))}
              >
                Retirer
              </Button>
            )}
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => setArticles([...articles, ''])}>
          + Ajouter un article
        </Button>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={saisir.isPending}>
          Créer la commande Emplettes
        </Button>
      </div>
    </form>
  );
}

function FormCoursesExpress() {
  const saisir = useSaisieManuelleCoursesExpress();
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [description, setDescription] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [etapes, setEtapes] = useState([{ description: '', pointDeRepere: '' }]);

  const reset = () => {
    setClientNom('');
    setClientTelephone('');
    setDescription('');
    setZoneId('');
    setEtapes([{ description: '', pointDeRepere: '' }]);
  };

  return (
    <form
      className="grid gap-3 rounded-xl p-4 ring-1 ring-foreground/10 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        saisir.mutate(
          {
            clientNom,
            clientTelephone,
            description,
            zoneId,
            modePaiement: 'especes',
            etapes,
          },
          {
            onSuccess: () => {
              toast.success('Commande Courses express créée.');
              reset();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <ClientFields
        clientNom={clientNom}
        setClientNom={setClientNom}
        clientTelephone={clientTelephone}
        setClientTelephone={setClientTelephone}
      />
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="courses-description">Description de la commission</Label>
        <Input
          id="courses-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="courses-zone">Zone</Label>
        <ZoneSelect id="courses-zone" value={zoneId} onChange={setZoneId} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label>Étapes</Label>
        {etapes.map((etape, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={etape.description}
              onChange={(e) => {
                const description = e.target.value;
                setEtapes(etapes.map((et, i) => (i === index ? { ...et, description } : et)));
              }}
              placeholder="Description de l'étape"
              required
            />
            <Input
              value={etape.pointDeRepere}
              onChange={(e) => {
                const pointDeRepere = e.target.value;
                setEtapes(etapes.map((et, i) => (i === index ? { ...et, pointDeRepere } : et)));
              }}
              placeholder="Point de repère"
              required
            />
            {etapes.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEtapes(etapes.filter((_, i) => i !== index))}
              >
                Retirer
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setEtapes([...etapes, { description: '', pointDeRepere: '' }])}
        >
          + Ajouter une étape
        </Button>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={saisir.isPending}>
          Créer la commande Courses express
        </Button>
      </div>
    </form>
  );
}

export function SaisieManuellePage() {
  const [service, setService] = useState<TypeService>('repas');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Saisie manuelle</h1>
        <p className="text-sm text-muted-foreground">
          Demande reçue par téléphone ou WhatsApp (F-ADM-04), pour les 4 services. Un compte
          client est créé ou retrouvé par numéro de téléphone (sans mot de passe) ; le mode de
          paiement est fixé à "espèces" ici, la tarification suit les mêmes règles que le
          parcours client normal.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SERVICES.map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={service === s.value ? 'default' : 'outline'}
            onClick={() => setService(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {service === 'repas' && <FormRepas />}
      {service === 'colis' && <FormColis />}
      {service === 'emplettes' && <FormEmplettes />}
      {service === 'courses_express' && <FormCoursesExpress />}
    </div>
  );
}
