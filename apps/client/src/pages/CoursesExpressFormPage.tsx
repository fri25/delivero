import { ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChoiceCards } from '@/components/forms/ChoiceCards';
import { FormStep } from '@/components/forms/FormStep';
import { SubmitBar } from '@/components/forms/SubmitBar';
import { EtapeFormRow } from '@/components/courses-express/EtapeFormRow';
import { useAuthStore } from '@/stores/auth-store';
import { useZones } from '@/api/zones';
import {
  useCreateCommandeCoursesExpress,
} from '@/api/commandes-courses-express';
import { useApresCreationCommande } from '@/api/paiements';
import type { ModePaiement } from '@/api/types';
import { lireModele, type ModeleCoursesExpress } from '@/lib/recommander';
import { PhotoPicker } from '@/components/medias/PhotoPicker';
import {
  useApresCreationInvite,
  useCreerCommandeInvite,
  type CommandeCoursesExpressInviteInput,
  type ContactInvite,
} from '@/api/invite';
import { ChoixCompteInvite } from '@/components/invite/ChoixCompteInvite';
import { ContactInviteFields } from '@/components/invite/ContactInviteFields';
import { useQuartiers } from '@/api/quartiers';
import {
  CHOIX_QUARTIER_VIDE,
  choixQuartierComplet,
  quartierChoisi,
  tarifCoursesExpress,
  versApi,
  type ChoixQuartier,
} from '@/lib/quartiers';

interface EtapeDraft {
  description: string;
  pointDeRepere: string;
  adresse: string;
  quartier: ChoixQuartier;
}

function nouvelleEtape(): EtapeDraft {
  return { description: '', pointDeRepere: '', adresse: '', quartier: CHOIX_QUARTIER_VIDE };
}

export function CoursesExpressFormPage() {
  const location = useLocation();
  const preRemplir = (location.state as { preRemplir?: ModeleCoursesExpress } | null)?.preRemplir;
  // F-CLI-07 : modèle passé par « Refaire cette course ».
  const modele = preRemplir ?? lireModele<ModeleCoursesExpress>(location.state);
  const token = useAuthStore((state) => state.token);
  const { data: zones } = useZones();
  const createCommande = useCreateCommandeCoursesExpress();
  const apresCreation = useApresCreationCommande();

  const [description, setDescription] = useState(modele?.description ?? '');
  const [photos, setPhotos] = useState<string[]>([]);
  // F-CLI-02 : course sans compte.
  const [sansCompte, setSansCompte] = useState(false);
  const [contact, setContact] = useState<ContactInvite>({ nom: '', telephone: '' });
  const creerInvite = useCreerCommandeInvite<CommandeCoursesExpressInviteInput>('courses_express');
  const apresCreationInvite = useApresCreationInvite();
  const envoiEnCours = createCommande.isPending || apresCreation.isPending || creerInvite.isPending;
  const [photoEnCours, setPhotoEnCours] = useState(false);
  const [zoneId, setZoneId] = useState<string | null>(modele?.zoneId ?? null);
  const [etapes, setEtapes] = useState<EtapeDraft[]>(
    modele?.etapes?.length
      ? modele.etapes.map((etape) => ({
          ...etape,
          quartier: { quartierId: etape.quartierId ?? '', precision: '' },
        }))
      : [nouvelleEtape()],
  );
  const { data: quartiers } = useQuartiers();
  const [modePaiement, setModePaiement] = useState<ModePaiement>(
    ESPECES_ACTIF ? 'especes' : 'mobile_money',
  );

  const zoneUnique = zones?.length === 1 ? zones.at(0) : undefined;
  const effectiveZoneId = zoneId ?? zoneUnique?.id ?? null;

  const etapesValides = etapes.filter(
    (etape) =>
      etape.description.trim().length > 0 &&
      etape.pointDeRepere.trim().length > 0 &&
      choixQuartierComplet(etape.quartier, quartiers),
  );
  // Dearest stop neighbourhood × number of stops (Q-28); the server recomputes it.
  const tarif = tarifCoursesExpress(
    etapesValides.map((etape) => Number(quartierChoisi(etape.quartier, quartiers)?.fraisLivraison ?? 0)),
  );

  const contactRenseigne = contact.nom.trim().length > 0 && contact.telephone.trim().length > 0;
  const etapesEntamees = etapes.some((etape) => etape.description.trim() || etape.pointDeRepere.trim());

  // In form order: the SubmitBar names the first one.
  const manquant: string[] = [];
  if (!description.trim()) manquant.push('ce qu\'il faut faire');
  if (!effectiveZoneId) manquant.push('zone');
  if (etapesValides.length === 0)
    manquant.push(etapesEntamees ? "action, quartier et point de repère d'un arrêt" : 'au moins un arrêt');
  if (!token && !sansCompte) manquant.push('se connecter ou continuer sans compte');
  else if (!token && !contactRenseigne) manquant.push('vos nom et téléphone');
  if (photoEnCours) manquant.push('envoi des photos en cours');

  const majEtape = (index: number, patch: Partial<EtapeDraft>) => {
    setEtapes((current) => current.map((etape, i) => (i === index ? { ...etape, ...patch } : etape)));
  };

  const envoyer = () => {
    if (!effectiveZoneId) {
      toast.error('Choisissez une zone.');
      return;
    }

    const course = {
      description: description.trim(),
      photoUrls: photos,
      zoneId: effectiveZoneId,
      modePaiement,
      etapes: etapesValides.map((etape) => ({
        description: etape.description.trim(),
        pointDeRepere: etape.pointDeRepere.trim(),
        adresse: etape.adresse.trim() || undefined,
        ...versApi(etape.quartier),
      })),
    };

    if (!token) {
      creerInvite.mutate(
        { ...course, invite: contact },
        {
          onSuccess: (creee) => void apresCreationInvite(creee, { mode: modePaiement, statut: 'en_attente' }),
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }

    createCommande.mutate(
      course,
      {
        onSuccess: (commande) => {
          apresCreation.continuer(commande, `/courses-express/commandes/${commande.id}`, 'Course envoyée !');
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 lg:max-w-6xl lg:space-y-6">
      <div>
        <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground lg:text-3xl">Faire une course</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retirer un document, déposer un paquet, une démarche en ville : décrivez la tâche, un livreur y va pour
          vous.
        </p>
      </div>
      {preRemplir && (
        <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-foreground">
          Les informations de votre ancienne course ont été reprises. Vérifiez chaque étape avant de confirmer.
        </p>
      )}

      {/* Desktop: steps on the left, sticky summary on the right. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="space-y-4">
          <FormStep numero={1} titre="Que faut-il faire ?" complete={description.trim().length > 0}>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="sr-only">
                Description de la course
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Ex. Retirer un document au guichet A et le déposer au bureau B avant 17h."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </div>
            <PhotoPicker
              usage="courses"
              max={3}
              label="Photos utiles (facultatif) : document, article, lieu"
              value={photos}
              onChange={setPhotos}
              onEnvoiChange={setPhotoEnCours}
            />
          </FormStep>

          <FormStep
            numero={2}
            titre="Où le livreur doit-il aller ?"
            aide="Un arrêt par lieu, dans l'ordre. Prix : le quartier le plus cher × le nombre d'arrêts."
            complete={etapesValides.length > 0 && Boolean(effectiveZoneId)}
          >
            {zones && zones.length > 1 && (
              <div className="space-y-1.5">
                <Label>Zone</Label>
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

            <ol className="space-y-3">
              {etapes.map((etape, index) => (
                <EtapeFormRow
                  key={index}
                  index={index}
                  description={etape.description}
                  pointDeRepere={etape.pointDeRepere}
                  adresse={etape.adresse}
                  quartier={etape.quartier}
                  onQuartierChange={(value) => majEtape(index, { quartier: value })}
                  onDescriptionChange={(value) => majEtape(index, { description: value })}
                  onPointDeRepereChange={(value) => majEtape(index, { pointDeRepere: value })}
                  onAdresseChange={(value) => majEtape(index, { adresse: value })}
                  onRemove={() => setEtapes((current) => current.filter((_, i) => i !== index))}
                  canRemove={etapes.length > 1}
                />
              ))}
            </ol>
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setEtapes((current) => [...current, nouvelleEtape()])}
            >
              <Plus /> Ajouter un arrêt
            </Button>
          </FormStep>

          {!token && (
            <FormStep
              numero={3}
              titre="Vos coordonnées"
              aide="Pour recevoir le suivi et être joint par le livreur."
              complete={contactRenseigne}
            >
              {sansCompte ? (
                <ContactInviteFields value={contact} onChange={setContact} />
              ) : (
                <ChoixCompteInvite onSansCompte={() => setSansCompte(true)} />
              )}
            </FormStep>
          )}

          <FormStep numero={token ? 3 : 4} titre="Paiement">
            {ESPECES_ACTIF ? (
              <ChoiceCards
                name="Mode de paiement"
                colonnes={2}
                value={modePaiement}
                options={[
                  { value: 'mobile_money', label: 'Mobile Money', detail: 'Payé maintenant' },
                  { value: 'especes', label: 'Espèces', detail: 'Payé à la remise' },
                ]}
                onChange={setModePaiement}
              />
            ) : (
              <p className="rounded-xl bg-secondary px-3 py-2.5 text-sm">
                <span className="font-medium">Mobile Money</span>
                <span className="text-muted-foreground"> — vous payez à la confirmation, depuis votre téléphone.</span>
              </p>
            )}
          </FormStep>

        </div>
        <SubmitBar
          titre="Votre course"
          tarif={tarif}
          manquant={manquant}
          enCours={envoiEnCours}
          libelle="Confirmer la course"
          onConfirmer={envoyer}
        />
      </div>
    </div>
  );
}
