import { useState } from 'react';
import { ExternalLink, LocateFixed, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAdresse, useUpdateAdresse, type AdresseInput } from '@/api/adresses';
import type { Adresse } from '@/api/types';
import { lienGoogleMaps, lirePositionGps } from '@/lib/geolocalisation';
import { versApi, type ChoixQuartier } from '@/lib/quartiers';
import { QuartierField } from './QuartierField';

interface Coordonnees {
  latitude: number;
  longitude: number;
  precision?: number;
}

function coordonneesInitiales(adresse?: Adresse): Coordonnees | null {
  if (!adresse?.latitude || !adresse.longitude) return null;
  return { latitude: Number(adresse.latitude), longitude: Number(adresse.longitude) };
}

/**
 * Creates an address, or edits `adresse` when given. The landmark stays
 * mandatory; the GPS position is only a complement (local addressing rule).
 */
export function AddressForm({
  adresse: adresseInitiale,
  onSaved,
  onCreated,
}: {
  adresse?: Adresse;
  onSaved?: (adresse: Adresse) => void;
  onCreated?: (adresse: Adresse) => void;
}) {
  const [libelle, setLibelle] = useState(adresseInitiale?.libelle ?? '');
  const [rue, setRue] = useState(adresseInitiale?.adresse ?? '');
  const [quartier, setQuartier] = useState<ChoixQuartier>({
    quartierId: adresseInitiale?.quartierId ?? '',
    precision: adresseInitiale?.quartierTarifaire?.autre ? (adresseInitiale.quartier ?? '') : '',
  });
  const [pointDeRepere, setPointDeRepere] = useState(adresseInitiale?.pointDeRepere ?? '');
  const [position, setPosition] = useState<Coordonnees | null>(() => coordonneesInitiales(adresseInitiale));
  const [localisationEnCours, setLocalisationEnCours] = useState(false);

  const createAdresse = useCreateAdresse();
  const updateAdresse = useUpdateAdresse();
  const enregistrement = createAdresse.isPending || updateAdresse.isPending;

  const localiser = async () => {
    setLocalisationEnCours(true);
    try {
      setPosition(await lirePositionGps());
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLocalisationEnCours(false);
    }
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const dto: AdresseInput = {
          libelle,
          adresse: rue,
          ...versApi(quartier),
          pointDeRepere,
          latitude: position?.latitude ?? null,
          longitude: position?.longitude ?? null,
          estParDefaut: true,
        };
        const options = {
          onSuccess: (saved: Adresse | void) => {
            if (saved) {
              onSaved?.(saved);
              onCreated?.(saved);
            }
          },
          onError: (error: Error) => toast.error(error.message),
        };
        if (adresseInitiale) {
          updateAdresse.mutate({ id: adresseInitiale.id, ...dto }, options);
        } else {
          createAdresse.mutate(dto, options);
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="libelle">Nom de l'adresse</Label>
        <Input
          id="libelle"
          placeholder="Maison, Bureau..."
          value={libelle}
          onChange={(event) => setLibelle(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="adresse">Adresse ou rue</Label>
        <Input
          id="adresse"
          placeholder="Rue, numéro ou indication d’accès"
          value={rue}
          onChange={(event) => setRue(event.target.value)}
          maxLength={180}
        />
      </div>

      <QuartierField id="quartier" value={quartier} onChange={setQuartier} />

      <div className="space-y-1.5">
        <Label htmlFor="pointDeRepere">Point de repère obligatoire</Label>
        <Input
          id="pointDeRepere"
          placeholder="Près du grand marché, portail bleu…"
          value={pointDeRepere}
          onChange={(event) => setPointDeRepere(event.target.value)}
          required
          maxLength={180}
        />
        <p className="text-xs text-muted-foreground">
          Le point de repère reste obligatoire, même lorsqu’une position GPS sera renseignée.
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">
          Position GPS <span className="font-normal text-muted-foreground">(facultatif)</span>
        </p>
        {position ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium">Position enregistrée</p>
              <a
                href={lienGoogleMaps(position.latitude, position.longitude)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline"
              >
                {position.precision !== undefined ? `À ${position.precision} m près · ` : ''}
                Vérifier sur la carte
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Retirer la position"
              onClick={() => setPosition(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={localisationEnCours}
            onClick={localiser}
          >
            <LocateFixed className="size-4" aria-hidden="true" />
            {localisationEnCours ? 'Localisation...' : 'Utiliser ma position actuelle'}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Le livreur se fie d'abord au point de repère. La position l'aide à vous trouver plus vite.
        </p>
      </div>

      <Button type="submit" disabled={enregistrement} className="w-full">
        {enregistrement ? 'Enregistrement...' : adresseInitiale ? 'Enregistrer' : "Ajouter l'adresse"}
      </Button>
    </form>
  );
}
