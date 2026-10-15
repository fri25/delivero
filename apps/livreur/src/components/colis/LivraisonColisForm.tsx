import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLivrerColis } from '@/api/commandes-colis';
import { apiFetch } from '@/api/client';
import { envoyerPhoto, miniature, type MediasConfig } from '@/lib/medias';
import type { CommandeColis } from '@/api/types';

export function LivraisonColisForm({ commande }: { commande: CommandeColis }) {
  const [codeOtp, setCodeOtp] = useState('');
  const [nomReceptionnaire, setNomReceptionnaire] = useState('');
  const [montantEncaisse, setMontantEncaisse] = useState('');
  const [photoPreuveUrl, setPhotoPreuveUrl] = useState<string | null>(null);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const inputFichier = useRef<HTMLInputElement>(null);
  const livrer = useLivrerColis();

  const { data: configMedias } = useQuery({
    queryKey: ['medias-config'],
    queryFn: () => apiFetch<MediasConfig>('/medias/config'),
    staleTime: Infinity,
  });

  const contreRembourseAttendu = commande.montantContreRemboursement !== null;

  const capturerPhoto = async (fichier: File) => {
    setEnvoiPhoto(true);
    try {
      const url = await envoyerPhoto(fichier, 'colis', configMedias?.tailleMaxOctets ?? 300 * 1024);
      setPhotoPreuveUrl(url);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnvoiPhoto(false);
    }
  };

  const confirmer = () => {
    setErreur(null);

    if (!codeOtp.trim()) {
      setErreur('Le code de remise fourni par le destinataire est obligatoire.');
      return;
    }
    if (contreRembourseAttendu && !montantEncaisse) {
      setErreur('Le montant encaissé est obligatoire pour ce colis (contre-remboursement).');
      return;
    }
    if (envoiPhoto) {
      setErreur('L’envoi de la photo de preuve est en cours. Veuillez patienter.');
      return;
    }

    livrer.mutate(
      {
        id: commande.id,
        codeOtp: codeOtp.trim(),
        nomReceptionnaire: nomReceptionnaire.trim() || undefined,
        montantEncaisse: montantEncaisse ? Number(montantEncaisse) : undefined,
        photoPreuveUrl: photoPreuveUrl ?? undefined,
      },
      {
        // La saisie n'est volontairement pas réinitialisée en cas d'erreur
        // (ex. code de remise incorrect) : l'utilisateur ne doit pas tout
        // ressaisir.
        onError: (error) => setErreur(error.message),
      },
    );
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium">Confirmer la livraison</p>

      <div className="space-y-1.5">
        <Label htmlFor={`otp-${commande.id}`}>Code de remise (fourni par le destinataire) *</Label>
        <Input
          id={`otp-${commande.id}`}
          inputMode="numeric"
          required
          value={codeOtp}
          onChange={(event) => setCodeOtp(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`receptionnaire-${commande.id}`}>Nom du réceptionnaire (optionnel)</Label>
        <Input
          id={`receptionnaire-${commande.id}`}
          value={nomReceptionnaire}
          onChange={(event) => setNomReceptionnaire(event.target.value)}
        />
      </div>

      {contreRembourseAttendu && (
        <div className="space-y-1.5">
          <Label htmlFor={`encaisse-${commande.id}`}>Montant encaissé (FCFA)</Label>
          <Input
            id={`encaisse-${commande.id}`}
            type="number"
            min={1}
            inputMode="numeric"
            value={montantEncaisse}
            onChange={(event) => setMontantEncaisse(event.target.value)}
          />
        </div>
      )}

      {/* F-CLI-22 : photo de preuve de livraison */}
      {configMedias?.actif && (
        <div className="space-y-1.5">
          <Label>Photo de preuve de livraison (facultatif)</Label>
          {photoPreuveUrl ? (
            <div className="relative inline-block">
              <img
                src={miniature(photoPreuveUrl)}
                alt="Preuve capturée"
                className="size-20 rounded-lg object-cover ring-1 ring-foreground/20"
              />
              <button
                type="button"
                onClick={() => setPhotoPreuveUrl(null)}
                aria-label="Supprimer la photo"
                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={envoiPhoto}
                onClick={() => inputFichier.current?.click()}
              >
                <Camera className="size-4" />
                {envoiPhoto ? 'Envoi...' : 'Prendre une photo'}
              </Button>
            </div>
          )}
          <input
            ref={inputFichier}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void capturerPhoto(f);
            }}
          />
        </div>
      )}

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      <Button className="w-full" disabled={livrer.isPending || envoiPhoto} onClick={confirmer}>
        {livrer.isPending ? 'Envoi...' : 'Confirmer la livraison'}
      </Button>
    </div>
  );
}
