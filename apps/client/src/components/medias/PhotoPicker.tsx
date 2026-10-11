import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/api/client';
import { envoyerPhoto, miniature, type MediasConfig, type UsageMedia } from '@/lib/medias';

/**
 * Optional photos for an order (F-CLI-16 colis, F-CLI-23 courses express).
 * Hidden entirely when uploads are not configured server-side.
 */
export function PhotoPicker({
  usage,
  max,
  value,
  onChange,
  onEnvoiChange,
  label,
}: {
  usage: UsageMedia;
  max: number;
  value: string[];
  onChange: (urls: string[]) => void;
  /** Lets the form block submission while a photo is still uploading. */
  onEnvoiChange?: (enCours: boolean) => void;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const { data: config } = useQuery({
    queryKey: ['medias-config'],
    queryFn: () => apiFetch<MediasConfig>('/medias/config'),
    staleTime: Infinity,
  });

  if (!config?.actif) return null;

  const ajouter = async (fichier: File) => {
    setEnvoiEnCours(true);
    onEnvoiChange?.(true);
    try {
      onChange([...value, await envoyerPhoto(fichier, usage, config.tailleMaxOctets)]);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setEnvoiEnCours(false);
      onEnvoiChange?.(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {label} <span className="font-normal text-muted-foreground">(facultatif)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div key={url} className="relative">
            <img src={miniature(url)} alt="" className="size-20 rounded-lg object-cover ring-1 ring-foreground/10" />
            <button
              type="button"
              aria-label="Retirer la photo"
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-foreground text-background"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <Button
            type="button"
            variant="outline"
            className="size-20 flex-col gap-1 text-xs"
            disabled={envoiEnCours}
            onClick={() => input.current?.click()}
          >
            <Camera className="size-5" aria-hidden="true" />
            {envoiEnCours ? 'Envoi...' : 'Photo'}
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const fichier = event.target.files?.[0];
          event.target.value = '';
          if (fichier) void ajouter(fichier);
        }}
      />
    </div>
  );
}
