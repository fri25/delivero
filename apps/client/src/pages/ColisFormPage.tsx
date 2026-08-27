import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddressPicker } from '@/components/adresses/AddressPicker';
import { useAuthStore } from '@/stores/auth-store';
import { useZones } from '@/api/zones';
import { useCreateCommandeColis, useEstimationColis } from '@/api/commandes-colis';
import { formatPrixFcfa } from '@/lib/format';
import type { ModePaiement, TailleColis } from '@/api/types';

const TAILLE_LABELS: Record<TailleColis, string> = {
  petit: 'Petit (pli, petit colis)',
  moyen: 'Moyen',
  grand: 'Grand',
};

export function ColisFormPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const { data: zones, isPending: zonesPending } = useZones();
  const createCommande = useCreateCommandeColis();

  const [adresseEnlevementId, setAdresseEnlevementId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [taille, setTaille] = useState<TailleColis>('petit');
  const [destinataireNom, setDestinataireNom] = useState('');
  const [destinataireTelephone, setDestinataireTelephone] = useState('');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [pointDeRepereLivraison, setPointDeRepereLivraison] = useState('');
  const [valeurDeclaree, setValeurDeclaree] = useState('');
  const [fragile, setFragile] = useState(false);
  const [contreRemboursement, setContreRemboursement] = useState(false);
  const [montantContreRemboursement, setMontantContreRemboursement] = useState('');
  const [modePaiement, setModePaiement] = useState<ModePaiement>('especes');
  const [planifie, setPlanifie] = useState(false);
  const [programmationAt, setProgrammationAt] = useState('');
  const [conditionsAcceptees, setConditionsAcceptees] = useState(false);

  // Une seule zone de collecte existe à ce jour (voir prisma/seed.ts) : pas
  // besoin d'imposer un choix à l'utilisateur pour un unique cas possible,
  // elle est retenue automatiquement tant qu'il n'y en a qu'une.
  const zoneUnique = zones?.length === 1 ? zones.at(0) : undefined;
  const effectiveZoneId = zoneId ?? zoneUnique?.id ?? null;

  const estimation = useEstimationColis(effectiveZoneId ?? undefined, taille);

  const montantContreRembourseNombre = useMemo(() => {
    const parsed = Number(montantContreRemboursement);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }, [montantContreRemboursement]);

  const peutConfirmer =
    Boolean(adresseEnlevementId) &&
    Boolean(effectiveZoneId) &&
    destinataireNom.trim().length > 0 &&
    destinataireTelephone.trim().length > 0 &&
    adresseLivraison.trim().length > 0 &&
    pointDeRepereLivraison.trim().length > 0 &&
    (!contreRemboursement || montantContreRembourseNombre !== undefined) &&
    (!planifie || programmationAt.length > 0) &&
    conditionsAcceptees;

  const envoyer = () => {
    if (!token) {
      toast.info('Connectez-vous pour envoyer une demande de colis.');
      navigate('/connexion');
      return;
    }
    if (!adresseEnlevementId || !effectiveZoneId) {
      toast.error("Choisissez l'adresse d'enlèvement.");
      return;
    }

    const estimationAvant = estimation.data?.tarif;

    createCommande.mutate(
      {
        adresseEnlevementId,
        zoneId: effectiveZoneId,
        taille,
        destinataireNom: destinataireNom.trim(),
        destinataireTelephone: destinataireTelephone.trim(),
        adresseLivraison: adresseLivraison.trim(),
        pointDeRepereLivraison: pointDeRepereLivraison.trim(),
        valeurDeclaree: valeurDeclaree ? Number(valeurDeclaree) : undefined,
        fragile,
        montantContreRemboursement: contreRemboursement ? montantContreRembourseNombre : undefined,
        modePaiement,
        programmationAt: planifie && programmationAt ? new Date(programmationAt).toISOString() : undefined,
        conditionsAcceptees,
      },
      {
        onSuccess: (commande) => {
          const tarifConfirme = commande.commande.montantTotal ? Number(commande.commande.montantTotal) : undefined;
          if (
            estimationAvant !== undefined &&
            tarifConfirme !== undefined &&
            tarifConfirme !== estimationAvant
          ) {
            toast.info(
              `Tarif confirmé : ${formatPrixFcfa(tarifConfirme)} (estimation initiale : ${formatPrixFcfa(estimationAvant)}).`,
            );
          } else {
            toast.success('Demande de colis envoyée !');
          }
          navigate(`/colis/commandes/${commande.id}`);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
          Envoyer un colis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enlèvement chez vous, livraison au destinataire — vous suivez chaque étape.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Adresse d'enlèvement</h2>
        {token ? (
          <AddressPicker value={adresseEnlevementId} onChange={setAdresseEnlevementId} />
        ) : (
          <p className="text-sm text-muted-foreground">Connectez-vous pour choisir une adresse.</p>
        )}
      </section>

      {zones && zones.length > 1 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Zone de collecte</h2>
          <Select value={zoneId ?? undefined} onValueChange={setZoneId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir une zone" />
            </SelectTrigger>
            <SelectContent>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      )}
      {!zonesPending && zones && zones.length === 0 && (
        <p className="text-sm text-destructive">
          Aucune zone de collecte n'est configurée pour le moment. Réessayez plus tard.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Colis</h2>

        <div className="space-y-1.5">
          <Label htmlFor="taille">Taille</Label>
          <Select value={taille} onValueChange={(value) => setTaille(value as TailleColis)}>
            <SelectTrigger id="taille" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TAILLE_LABELS) as [TailleColis, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="valeurDeclaree">Valeur déclarée (FCFA, facultatif)</Label>
          <Input
            id="valeurDeclaree"
            type="number"
            min={0}
            inputMode="numeric"
            value={valeurDeclaree}
            onChange={(event) => setValeurDeclaree(event.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={fragile} onCheckedChange={(checked) => setFragile(checked === true)} />
          Colis fragile
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Destinataire</h2>

        <div className="space-y-1.5">
          <Label htmlFor="destinataireNom">Nom</Label>
          <Input
            id="destinataireNom"
            value={destinataireNom}
            onChange={(event) => setDestinataireNom(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="destinataireTelephone">Téléphone</Label>
          <Input
            id="destinataireTelephone"
            type="tel"
            value={destinataireTelephone}
            onChange={(event) => setDestinataireTelephone(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="adresseLivraison">Adresse de livraison</Label>
          <Input
            id="adresseLivraison"
            value={adresseLivraison}
            onChange={(event) => setAdresseLivraison(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pointDeRepereLivraison">Point de repère (obligatoire)</Label>
          <Input
            id="pointDeRepereLivraison"
            placeholder="Près du grand marché, portail bleu..."
            value={pointDeRepereLivraison}
            onChange={(event) => setPointDeRepereLivraison(event.target.value)}
            required
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Contre-remboursement</h2>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={contreRemboursement}
            onCheckedChange={(checked) => setContreRemboursement(checked === true)}
          />
          Le livreur doit encaisser un montant auprès du destinataire
        </label>
        {contreRemboursement && (
          <div className="space-y-1.5">
            <Label htmlFor="montantContreRemboursement">Montant à encaisser (FCFA)</Label>
            <Input
              id="montantContreRemboursement"
              type="number"
              min={1}
              inputMode="numeric"
              value={montantContreRemboursement}
              onChange={(event) => setMontantContreRemboursement(event.target.value)}
              required
            />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Enlèvement</h2>
        <div className="flex gap-2">
          <Button type="button" variant={planifie ? 'outline' : 'default'} onClick={() => setPlanifie(false)}>
            Immédiat
          </Button>
          <Button type="button" variant={planifie ? 'default' : 'outline'} onClick={() => setPlanifie(true)}>
            Planifié
          </Button>
        </div>
        {planifie && (
          <Input
            type="datetime-local"
            value={programmationAt}
            onChange={(event) => setProgrammationAt(event.target.value)}
            required
          />
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Paiement des frais de livraison</h2>
        <Select value={modePaiement} onValueChange={(value) => setModePaiement(value as ModePaiement)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="especes">Espèces à la livraison</SelectItem>
            <SelectItem value="mobile_money">Mobile Money</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {estimation.data && (
        <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
          <span className="text-muted-foreground">Tarif indicatif</span>
          <span className="font-medium">{formatPrixFcfa(estimation.data.tarif)}</span>
        </div>
      )}

      <section className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="font-medium">Objets interdits au transport</p>
        <p className="text-muted-foreground">
          Produits inflammables, armes, espèces animales, médicaments sur ordonnance sans validation.
        </p>
        <label className="flex items-start gap-2 pt-1">
          <Checkbox
            checked={conditionsAcceptees}
            onCheckedChange={(checked) => setConditionsAcceptees(checked === true)}
          />
          <span>Je confirme que ce colis ne contient aucun objet interdit et j'accepte les conditions.</span>
        </label>
      </section>

      <Button
        className="w-full"
        disabled={!peutConfirmer || createCommande.isPending}
        onClick={envoyer}
      >
        {createCommande.isPending ? 'Envoi...' : token ? 'Confirmer la demande' : 'Se connecter pour confirmer'}
      </Button>
    </div>
  );
}
