import { ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { EtapeFormRow } from '@/components/courses-express/EtapeFormRow';
import { useAuthStore } from '@/stores/auth-store';
import { useZones } from '@/api/zones';
import {
  useCreateCommandeCoursesExpress,
  useEstimationCoursesExpress,
} from '@/api/commandes-courses-express';
import { formatPrixFcfa } from '@/lib/format';
import type { ModePaiement } from '@/api/types';

interface EtapeDraft {
  description: string;
  pointDeRepere: string;
  adresse: string;
}

function nouvelleEtape(): EtapeDraft {
  return { description: '', pointDeRepere: '', adresse: '' };
}

export function CoursesExpressFormPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const { data: zones } = useZones();
  const createCommande = useCreateCommandeCoursesExpress();

  const [description, setDescription] = useState('');
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [etapes, setEtapes] = useState<EtapeDraft[]>([nouvelleEtape()]);
  const [modePaiement, setModePaiement] = useState<ModePaiement>(
    ESPECES_ACTIF ? 'especes' : 'mobile_money',
  );

  const zoneUnique = zones?.length === 1 ? zones.at(0) : undefined;
  const effectiveZoneId = zoneId ?? zoneUnique?.id ?? null;

  const etapesValides = etapes.filter(
    (etape) => etape.description.trim().length > 0 && etape.pointDeRepere.trim().length > 0,
  );
  const estimation = useEstimationCoursesExpress(
    effectiveZoneId ?? undefined,
    etapesValides.length > 0 ? etapesValides.length : undefined,
  );

  const peutConfirmer =
    Boolean(effectiveZoneId) && description.trim().length > 0 && etapesValides.length > 0;

  const majEtape = (index: number, patch: Partial<EtapeDraft>) => {
    setEtapes((current) => current.map((etape, i) => (i === index ? { ...etape, ...patch } : etape)));
  };

  const envoyer = () => {
    if (!token) {
      toast.info('Connectez-vous pour envoyer une demande de course.');
      navigate('/connexion');
      return;
    }
    if (!effectiveZoneId) {
      toast.error('Choisissez une zone.');
      return;
    }

    createCommande.mutate(
      {
        description: description.trim(),
        zoneId: effectiveZoneId,
        modePaiement,
        etapes: etapesValides.map((etape) => ({
          description: etape.description.trim(),
          pointDeRepere: etape.pointDeRepere.trim(),
          adresse: etape.adresse.trim() || undefined,
        })),
      },
      {
        onSuccess: (commande) => {
          toast.success('Course envoyée !');
          navigate(`/courses-express/commandes/${commande.id}`);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl leading-tight font-semibold text-foreground">
          Une course à faire ?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dépôt, retrait, démarche de proximité — décrivez la tâche, un livreur s'en charge.
        </p>
      </div>

      <section className="space-y-1.5">
        <Label htmlFor="description">Ce qu'il faut faire</Label>
        <Textarea
          id="description"
          placeholder="Ex. Retirer un document au guichet A et le déposer au bureau B avant 17h."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </section>

      {zones && zones.length > 1 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Zone</h2>
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Étapes</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEtapes((current) => [...current, nouvelleEtape()])}
          >
            Ajouter une étape
          </Button>
        </div>
        <div className="space-y-3">
          {etapes.map((etape, index) => (
            <EtapeFormRow
              key={index}
              index={index}
              description={etape.description}
              pointDeRepere={etape.pointDeRepere}
              adresse={etape.adresse}
              onDescriptionChange={(value) => majEtape(index, { description: value })}
              onPointDeRepereChange={(value) => majEtape(index, { pointDeRepere: value })}
              onAdresseChange={(value) => majEtape(index, { adresse: value })}
              onRemove={() => setEtapes((current) => current.filter((_, i) => i !== index))}
              canRemove={etapes.length > 1}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Paiement</h2>
        {ESPECES_ACTIF ? (
          <Select value={modePaiement} onValueChange={(value) => setModePaiement(value as ModePaiement)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="especes">Espèces à la remise</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <p className="rounded-lg border border-border px-3 py-2 text-sm">Mobile Money</p>
        )}
      </section>

      {estimation.data && (
        <div className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
          <span className="text-muted-foreground">
            Tarif indicatif ({estimation.data.nombreEtapes} étape
            {estimation.data.nombreEtapes > 1 ? 's' : ''})
          </span>
          <span className="font-medium">{formatPrixFcfa(estimation.data.tarif)}</span>
        </div>
      )}

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
