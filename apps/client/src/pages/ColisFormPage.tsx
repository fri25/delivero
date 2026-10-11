import { CONTRE_REMBOURSEMENT_ACTIF, ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
import { PhotoPicker } from '@/components/medias/PhotoPicker';
import {
  useApresCreationInvite,
  useCreerCommandeInvite,
  type AdresseInvite,
  type CommandeColisInviteInput,
  type ContactInvite,
} from '@/api/invite';
import { AdresseInviteFields } from '@/components/invite/AdresseInviteFields';
import { ChoixCompteInvite } from '@/components/invite/ChoixCompteInvite';
import { ContactInviteFields } from '@/components/invite/ContactInviteFields';
import { useAuthStore } from '@/stores/auth-store';
import { useZones } from '@/api/zones';
import { useCreateCommandeColis, useEstimationColis } from '@/api/commandes-colis';
import { useApresCreationCommande } from '@/api/paiements';
import { formatPrixFcfa } from '@/lib/format';
import type { ModePaiement, TailleColis } from '@/api/types';
import { lireModele, type ModeleColis } from '@/lib/recommander';

const TAILLE_LABELS: Record<TailleColis, string> = {
  petit: 'Petit (pli, petit colis)',
  moyen: 'Moyen',
  grand: 'Grand',
};

export function ColisFormPage() {
  const location = useLocation();
  const preRemplir = (location.state as { preRemplir?: ModeleColis } | null)?.preRemplir;
  // F-CLI-07 : modèle passé par « Envoyer un colis similaire ».
  const modele = preRemplir ?? lireModele<ModeleColis>(location.state);
  const token = useAuthStore((state) => state.token);
  const { data: zones, isPending: zonesPending } = useZones();
  const createCommande = useCreateCommandeColis();
  const apresCreation = useApresCreationCommande();

  const [adresseEnlevementId, setAdresseEnlevementId] = useState<string | null>(modele?.adresseEnlevementId ?? null);
  const [zoneId, setZoneId] = useState<string | null>(modele?.zoneId ?? null);
  const [taille, setTaille] = useState<TailleColis>(modele?.taille ?? 'petit');
  const [destinataireNom, setDestinataireNom] = useState(modele?.destinataireNom ?? '');
  const [destinataireTelephone, setDestinataireTelephone] = useState(modele?.destinataireTelephone ?? '');
  const [adresseLivraison, setAdresseLivraison] = useState(modele?.adresseLivraison ?? '');
  const [pointDeRepereLivraison, setPointDeRepereLivraison] = useState(modele?.pointDeRepereLivraison ?? '');
  const [valeurDeclaree, setValeurDeclaree] = useState(modele?.valeurDeclaree ?? '');
  const [fragile, setFragile] = useState(modele?.fragile ?? false);
  const [contreRemboursement, setContreRemboursement] = useState(false);
  const [montantContreRemboursement, setMontantContreRemboursement] = useState('');
  const [modePaiement, setModePaiement] = useState<ModePaiement>(
    ESPECES_ACTIF ? 'especes' : 'mobile_money',
  );
  const [planifie, setPlanifie] = useState(false);
  const [programmationAt, setProgrammationAt] = useState('');
  const [conditionsAcceptees, setConditionsAcceptees] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  // F-CLI-02 : envoi sans compte.
  const [sansCompte, setSansCompte] = useState(false);
  const [contact, setContact] = useState<ContactInvite>({ nom: '', telephone: '' });
  const [enlevementInvite, setEnlevementInvite] = useState<AdresseInvite>({ pointDeRepere: '' });
  const creerInvite = useCreerCommandeInvite<CommandeColisInviteInput>('colis');
  const apresCreationInvite = useApresCreationInvite();
  const envoiEnCours = createCommande.isPending || apresCreation.isPending || creerInvite.isPending;
  const [photoEnCours, setPhotoEnCours] = useState(false);

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

  const expediteurRenseigne = token
    ? Boolean(adresseEnlevementId)
    : sansCompte &&
      contact.nom.trim().length > 0 &&
      contact.telephone.trim().length > 0 &&
      enlevementInvite.pointDeRepere.trim().length > 0;

  const peutConfirmer =
    expediteurRenseigne &&
    Boolean(effectiveZoneId) &&
    destinataireNom.trim().length > 0 &&
    destinataireTelephone.trim().length > 0 &&
    adresseLivraison.trim().length > 0 &&
    pointDeRepereLivraison.trim().length > 0 &&
    (!contreRemboursement || montantContreRembourseNombre !== undefined) &&
    (!planifie || programmationAt.length > 0) &&
    conditionsAcceptees &&
    !photoEnCours;

  const envoyer = () => {
    const champsCommuns = {
      taille,
      destinataireNom: destinataireNom.trim(),
      destinataireTelephone: destinataireTelephone.trim(),
      adresseLivraison: adresseLivraison.trim(),
      pointDeRepereLivraison: pointDeRepereLivraison.trim(),
      valeurDeclaree: valeurDeclaree ? Number(valeurDeclaree) : undefined,
      fragile,
      photoUrl: photos[0],
      modePaiement,
      programmationAt: planifie && programmationAt ? new Date(programmationAt).toISOString() : undefined,
      conditionsAcceptees,
    };

    if (!token) {
      if (!effectiveZoneId) return;
      creerInvite.mutate(
        { ...champsCommuns, invite: contact, adresseEnlevement: enlevementInvite, zoneId: effectiveZoneId },
        {
          onSuccess: (creee) => void apresCreationInvite(creee, { mode: modePaiement, statut: 'en_attente' }),
          onError: (error) => toast.error(error.message),
        },
      );
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
        photoUrl: photos[0],
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
          }
          apresCreation.continuer(commande, `/colis/commandes/${commande.id}`, 'Demande de colis envoyée !');
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
      {preRemplir && <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-foreground">Les informations de votre ancien envoi ont été reprises. Vérifiez-les avant de confirmer.</p>}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Adresse d'enlèvement</h2>
        {token ? (
          <AddressPicker value={adresseEnlevementId} onChange={setAdresseEnlevementId} />
        ) : sansCompte ? (
          <div className="space-y-3">
            <ContactInviteFields value={contact} onChange={setContact} />
            <AdresseInviteFields
              id="enlevement-invite"
              label="Point de repère pour l'enlèvement"
              value={enlevementInvite}
              onChange={setEnlevementInvite}
            />
          </div>
        ) : (
          <ChoixCompteInvite onSansCompte={() => setSansCompte(true)} />
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

        <PhotoPicker
          usage="colis"
          max={1}
          label="Photo du colis"
          value={photos}
          onChange={setPhotos}
          onEnvoiChange={setPhotoEnCours}
        />
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

      {/* RG-04 : le contre-remboursement suppose un encaissement en espèces
          auprès du destinataire — retiré de la V1 avec les espèces (voir
          packages/config/perimetre-v1.ts). */}
      {CONTRE_REMBOURSEMENT_ACTIF && (
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
      )}

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
        {ESPECES_ACTIF ? (
          <Select value={modePaiement} onValueChange={(value) => setModePaiement(value as ModePaiement)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="especes">Espèces à la livraison</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <p className="rounded-lg border border-border px-3 py-2 text-sm">Mobile Money</p>
        )}
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
        disabled={!peutConfirmer || envoiEnCours}
        onClick={envoyer}
      >
        {envoiEnCours ? 'Envoi...' : 'Confirmer la demande'}
      </Button>
    </div>
  );
}
