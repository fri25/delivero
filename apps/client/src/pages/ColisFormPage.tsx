import { CONTRE_REMBOURSEMENT_ACTIF, ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
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
import { ChoiceCards, type ChoiceOption } from '@/components/forms/ChoiceCards';
import { FormStep } from '@/components/forms/FormStep';
import { SubmitBar } from '@/components/forms/SubmitBar';
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
import { useCreateCommandeColis } from '@/api/commandes-colis';
import { useQuartiers } from '@/api/quartiers';
import { QuartierField } from '@/components/adresses/QuartierField';
import { choixQuartierComplet, quartierChoisi, type ChoixQuartier } from '@/lib/quartiers';
import { useApresCreationCommande } from '@/api/paiements';
import { formatPrixFcfa } from '@/lib/format';
import type { ModePaiement, TailleColis } from '@/api/types';
import { lireModele, type ModeleColis } from '@/lib/recommander';

// Approximate sizes (docs/service-colis.md): examples, not dimensions.
const TAILLES: ChoiceOption<TailleColis>[] = [
  { value: 'petit', label: 'Petit', detail: 'Enveloppe, sachet' },
  { value: 'moyen', label: 'Moyen', detail: 'Carton, sac' },
  { value: 'grand', label: 'Grand', detail: 'Gros carton' },
];

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
  const [nature, setNature] = useState(modele?.nature ?? '');
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
  const [enlevementInvite, setEnlevementInvite] = useState<AdresseInvite>({ quartierId: '', pointDeRepere: '' });
  // Recipient's neighbourhood: sets the price (Q-28, 13/10).
  const [quartierLivraison, setQuartierLivraison] = useState<ChoixQuartier>({
    quartierId: modele?.quartierLivraisonId ?? '',
    precision: '',
  });
  const { data: quartiers } = useQuartiers();
  const creerInvite = useCreerCommandeInvite<CommandeColisInviteInput>('colis');
  const apresCreationInvite = useApresCreationInvite();
  const envoiEnCours = createCommande.isPending || apresCreation.isPending || creerInvite.isPending;
  const [photoEnCours, setPhotoEnCours] = useState(false);

  // Une seule zone de collecte existe à ce jour (voir prisma/seed.ts) : pas
  // besoin d'imposer un choix à l'utilisateur pour un unique cas possible,
  // elle est retenue automatiquement tant qu'il n'y en a qu'une.
  const zoneUnique = zones?.length === 1 ? zones.at(0) : undefined;
  const effectiveZoneId = zoneId ?? zoneUnique?.id ?? null;

  // Price = fee of the delivery neighbourhood; the server recomputes it.
  const tarif = quartierChoisi(quartierLivraison, quartiers)?.fraisLivraison;

  const montantContreRembourseNombre = useMemo(() => {
    const parsed = Number(montantContreRemboursement);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }, [montantContreRemboursement]);

  const expediteurRenseigne = token
    ? Boolean(adresseEnlevementId)
    : sansCompte &&
      contact.nom.trim().length > 0 &&
      contact.telephone.trim().length > 0 &&
      enlevementInvite.quartierId.length > 0 &&
      enlevementInvite.pointDeRepere.trim().length > 0;

  const destinataireRenseigne =
    destinataireNom.trim().length > 0 &&
    destinataireTelephone.trim().length > 0 &&
    choixQuartierComplet(quartierLivraison, quartiers) &&
    pointDeRepereLivraison.trim().length > 0;

  // In form order: the SubmitBar names the first one.
  const manquant: string[] = [];
  if (!token && !sansCompte) manquant.push('se connecter ou continuer sans compte');
  else if (!expediteurRenseigne) manquant.push("lieu d'enlèvement");
  if (!effectiveZoneId) manquant.push('zone de collecte');
  if (!destinataireNom.trim()) manquant.push('nom du destinataire');
  if (!destinataireTelephone.trim()) manquant.push('téléphone du destinataire');
  if (!choixQuartierComplet(quartierLivraison, quartiers)) manquant.push('quartier du destinataire');
  if (!pointDeRepereLivraison.trim()) manquant.push('point de repère de livraison');
  if (contreRemboursement && montantContreRembourseNombre === undefined) manquant.push('montant à encaisser');
  if (planifie && !programmationAt) manquant.push("date d'enlèvement");
  if (!conditionsAcceptees) manquant.push('confirmer : aucun objet interdit');
  if (photoEnCours) manquant.push('envoi de la photo en cours');

  const envoyer = () => {
    const champsCommuns = {
      taille,
      nature: nature.trim() || undefined,
      destinataireNom: destinataireNom.trim(),
      destinataireTelephone: destinataireTelephone.trim(),
      quartierLivraisonId: quartierLivraison.quartierId,
      quartierLivraison: quartierLivraison.precision.trim() || undefined,
      adresseLivraison: adresseLivraison.trim() || undefined,
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

    const estimationAvant = tarif !== undefined ? Number(tarif) : undefined;

    createCommande.mutate(
      {
        adresseEnlevementId,
        zoneId: effectiveZoneId,
        taille,
        nature: nature.trim() || undefined,
        destinataireNom: destinataireNom.trim(),
        destinataireTelephone: destinataireTelephone.trim(),
        quartierLivraisonId: quartierLivraison.quartierId,
        quartierLivraison: quartierLivraison.precision.trim() || undefined,
        adresseLivraison: adresseLivraison.trim() || undefined,
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
    <div className="mx-auto max-w-2xl space-y-4 lg:max-w-6xl lg:space-y-6">
      <div>
        <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground lg:text-3xl">Envoyer un colis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un livreur vient chercher votre colis et le remet à votre destinataire. Vous suivez chaque étape.
        </p>
      </div>
      {preRemplir && (
        <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-foreground">
          Les informations de votre ancien envoi ont été reprises. Vérifiez-les avant de confirmer.
        </p>
      )}

      {/* Desktop: steps on the left, sticky summary on the right. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="space-y-4">
          <FormStep
            numero={1}
            titre="Où récupérer le colis ?"
            aide="Le livreur passe le chercher à cette adresse."
            complete={expediteurRenseigne && Boolean(effectiveZoneId)}
          >
            {token ? (
              <AddressPicker value={adresseEnlevementId} onChange={setAdresseEnlevementId} />
            ) : sansCompte ? (
              <div className="space-y-4">
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

            {zones && zones.length > 1 && (
              <div className="space-y-1.5">
                <Label>Zone de collecte</Label>
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
              </div>
            )}
            {!zonesPending && zones && zones.length === 0 && (
              <p className="text-sm text-destructive">
                Aucune zone de collecte n'est configurée pour le moment. Réessayez plus tard.
              </p>
            )}
          </FormStep>

          <FormStep numero={2} titre="Votre colis" aide="La taille aide le livreur à prévoir le transport.">
            <ChoiceCards name="Taille du colis" value={taille} options={TAILLES} onChange={setTaille} />

            <div className="space-y-1.5">
              <Label htmlFor="natureColis">
                Nature ou contenu du colis <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Input
                id="natureColis"
                placeholder="Ex. Documents, vêtements, nourriture, électronique..."
                value={nature}
                onChange={(event) => setNature(event.target.value)}
                maxLength={120}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Documents', 'Vêtements', 'Nourriture', 'Électronique', 'Cadeau'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setNature(suggestion)}
                    className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground hover:bg-secondary/80"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 text-sm">
              <Checkbox checked={fragile} onCheckedChange={(checked) => setFragile(checked === true)} />
              <span>
                <span className="font-medium">Colis fragile</span>
                <span className="text-muted-foreground"> — le livreur le manipulera avec soin</span>
              </span>
            </label>

            <div className="space-y-1.5">
              <Label htmlFor="valeurDeclaree">
                Valeur du colis <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <div className="relative">
                <Input
                  id="valeurDeclaree"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Ex. 15000"
                  className="pr-16"
                  value={valeurDeclaree}
                  onChange={(event) => setValeurDeclaree(event.target.value)}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                  FCFA
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Sert de référence en cas de perte ou de dommage.</p>
            </div>

            <PhotoPicker
              usage="colis"
              max={1}
              label="Photo du colis (facultatif)"
              value={photos}
              onChange={setPhotos}
              onEnvoiChange={setPhotoEnCours}
            />
          </FormStep>

          <FormStep
            numero={3}
            titre="À qui le livrer ?"
            aide="Le livreur appelle le destinataire s'il ne le trouve pas."
            complete={destinataireRenseigne}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="destinataireNom">Nom du destinataire</Label>
                <Input
                  id="destinataireNom"
                  autoComplete="off"
                  value={destinataireNom}
                  onChange={(event) => setDestinataireNom(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="destinataireTelephone">Son téléphone</Label>
                <Input
                  id="destinataireTelephone"
                  type="tel"
                  inputMode="tel"
                  placeholder="01 XX XX XX XX"
                  value={destinataireTelephone}
                  onChange={(event) => setDestinataireTelephone(event.target.value)}
                  required
                />
              </div>
            </div>

            <QuartierField
              id="quartierLivraison"
              label="Quartier du destinataire"
              value={quartierLivraison}
              onChange={setQuartierLivraison}
            />

            <div className="space-y-1.5">
              <Label htmlFor="pointDeRepereLivraison">Point de repère</Label>
              <Input
                id="pointDeRepereLivraison"
                placeholder="Près du grand marché, portail bleu..."
                value={pointDeRepereLivraison}
                onChange={(event) => setPointDeRepereLivraison(event.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Un lieu que tout le monde connaît : boutique, école, carrefour, couleur du portail.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adresseLivraison">
                Rue, maison <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Input
                id="adresseLivraison"
                placeholder="Ex. 2e rue après la pharmacie, maison à étage"
                value={adresseLivraison}
                onChange={(event) => setAdresseLivraison(event.target.value)}
                maxLength={180}
              />
            </div>

            {/* RG-04 : le contre-remboursement suppose un encaissement en espèces
                auprès du destinataire — retiré de la V1 avec les espèces (voir
                packages/config/perimetre-v1.ts). */}
            {CONTRE_REMBOURSEMENT_ACTIF && (
              <div className="space-y-3">
                <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 text-sm">
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
              </div>
            )}
          </FormStep>

          <FormStep
            numero={4}
            titre="Quand et comment payer ?"
            complete={(!planifie || programmationAt.length > 0) && conditionsAcceptees}
          >
            <div className="space-y-1.5">
              <Label>Enlèvement</Label>
              <ChoiceCards
                name="Moment de l'enlèvement"
                colonnes={2}
                value={planifie ? 'planifie' : 'immediat'}
                options={[
                  { value: 'immediat', label: 'Maintenant', detail: 'Dès qu’un livreur est libre' },
                  { value: 'planifie', label: 'Plus tard', detail: 'Choisir le jour et l’heure' },
                ]}
                onChange={(value) => setPlanifie(value === 'planifie')}
              />
              {planifie && (
                <Input
                  type="datetime-local"
                  aria-label="Date et heure d'enlèvement"
                  value={programmationAt}
                  onChange={(event) => setProgrammationAt(event.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Paiement des frais de livraison</Label>
              {ESPECES_ACTIF ? (
                <ChoiceCards
                  name="Mode de paiement"
                  colonnes={2}
                  value={modePaiement}
                  options={[
                    { value: 'mobile_money', label: 'Mobile Money', detail: 'Payé maintenant' },
                    { value: 'especes', label: 'Espèces', detail: 'Payé à la livraison' },
                  ]}
                  onChange={setModePaiement}
                />
              ) : (
                <p className="rounded-xl bg-secondary px-3 py-2.5 text-sm">
                  <span className="font-medium">Mobile Money</span>
                  <span className="text-muted-foreground"> — vous payez à la confirmation, depuis votre téléphone.</span>
                </p>
              )}
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <Checkbox
                className="mt-0.5"
                checked={conditionsAcceptees}
                onCheckedChange={(checked) => setConditionsAcceptees(checked === true)}
              />
              <span>
                <span className="font-medium">Mon colis ne contient aucun objet interdit</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Produits inflammables, armes, animaux, médicaments sur ordonnance sans validation.
                </span>
              </span>
            </label>
          </FormStep>

        </div>
        <SubmitBar
          titre="Votre envoi"
          tarif={tarif}
          manquant={manquant}
          enCours={envoiEnCours}
          libelle="Confirmer l'envoi"
          onConfirmer={envoyer}
        />
      </div>
    </div>
  );
}
