import { useRef, useState } from 'react';
import { Camera, CheckCircle2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarquerColisRecupere } from '@/api/commandes-colis';
import { apiFetch } from '@/api/client';
import { envoyerPhoto, miniature, type MediasConfig } from '@/lib/medias';
import type { CommandeColis } from '@/api/types';

const ETATS_RAPIDES = [
  'Emballage intact & scellé',
  'Emballage froissé / usé',
  'Colis fragile contrôlé',
  'Contenu protégé sous scellé',
];

export function RecuperationColisForm({ commande }: { commande: CommandeColis }) {
  const [etatEnlevement, setEtatEnlevement] = useState('Emballage intact & scellé');
  const [remarque, setRemarque] = useState('');
  const [photoEnlevementUrl, setPhotoEnlevementUrl] = useState<string | null>(null);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const inputFichier = useRef<HTMLInputElement>(null);
  const marquerRecupere = useMarquerColisRecupere();

  const { data: configMedias } = useQuery({
    queryKey: ['medias-config'],
    queryFn: () => apiFetch<MediasConfig>('/medias/config'),
    staleTime: Infinity,
  });

  const capturerPhoto = async (fichier: File) => {
    setEnvoiPhoto(true);
    try {
      const url = await envoyerPhoto(fichier, 'colis', configMedias?.tailleMaxOctets ?? 300 * 1024);
      setPhotoEnlevementUrl(url);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnvoiPhoto(false);
    }
  };

  const confirmer = () => {
    setErreur(null);
    if (envoiPhoto) {
      setErreur('L’envoi de la photo du colis est en cours. Veuillez patienter.');
      return;
    }

    const etatFinal = remarque.trim() ? `${etatEnlevement} (${remarque.trim()})` : etatEnlevement;

    marquerRecupere.mutate(
      {
        id: commande.id,
        etatEnlevement: etatFinal,
        photoEnlevementUrl: photoEnlevementUrl ?? undefined,
      },
      {
        onError: (error) => setErreur(error.message),
      },
    );
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="size-4 text-primary" />
          Contrôle visuel à l’enlèvement
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Vérifiez l’état extérieur du colis remis par l’expéditeur.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">État constaté</Label>
        <div className="flex flex-wrap gap-1.5">
          {ETATS_RAPIDES.map((etat) => (
            <button
              key={etat}
              type="button"
              onClick={() => setEtatEnlevement(etat)}
              className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                etatEnlevement === etat
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {etat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remarque-enlevement" className="text-xs">
          Remarque particulière <span className="font-normal text-muted-foreground">(facultatif)</span>
        </Label>
        <Input
          id="remarque-enlevement"
          placeholder="Ex : scotch renforcé, traces d’usure..."
          value={remarque}
          onChange={(e) => setRemarque(e.target.value)}
          className="text-xs h-8"
        />
      </div>

      {/* Photo à l'enlèvement (F-LIV-06) */}
      <div className="space-y-2">
        <Label className="text-xs">
          Photo du colis à la prise en charge <span className="font-normal text-muted-foreground">(recommandé)</span>
        </Label>
        <input
          ref={inputFichier}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            if (fichier) void capturerPhoto(fichier);
          }}
        />

        {photoEnlevementUrl ? (
          <div className="relative inline-block">
            <img
              src={miniature(photoEnlevementUrl, 120)}
              alt="Colis à l’enlèvement"
              className="size-20 rounded-lg object-cover ring-1 ring-border"
            />
            <button
              type="button"
              onClick={() => {
                setPhotoEnlevementUrl(null);
                if (inputFichier.current) inputFichier.current.value = '';
              }}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-sm"
              title="Supprimer la photo"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            disabled={envoiPhoto}
            onClick={() => inputFichier.current?.click()}
          >
            <Camera className="size-4" />
            {envoiPhoto ? 'Téléversement...' : 'Prendre une photo du colis'}
          </Button>
        )}
      </div>

      {erreur && (
        <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {erreur}
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={marquerRecupere.isPending || envoiPhoto}
        onClick={confirmer}
      >
        {marquerRecupere.isPending ? 'Confirmation...' : 'Confirmer la récupération du colis'}
      </Button>
    </div>
  );
}
