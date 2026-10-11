import { useState } from 'react';
import { ExternalLink, LocateFixed, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdresseInvite } from '@/api/invite';
import { lienGoogleMaps, lirePositionGps } from '@/lib/geolocalisation';

/**
 * Inline address for a guest (no address book). Landmark mandatory, GPS
 * optional — same local rule as AddressForm.
 */
export function AdresseInviteFields({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: AdresseInvite;
  onChange: (value: AdresseInvite) => void;
}) {
  const [localisation, setLocalisation] = useState(false);
  const aPosition = value.latitude !== undefined && value.longitude !== undefined;

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          placeholder="Près du grand marché, portail bleu..."
          value={value.pointDeRepere}
          onChange={(event) => onChange({ ...value, pointDeRepere: event.target.value })}
          required
        />
      </div>
      {aPosition ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <a
            href={lienGoogleMaps(value.latitude!, value.longitude!)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground underline"
          >
            Position enregistrée <ExternalLink className="size-3" aria-hidden="true" />
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Retirer la position"
            onClick={() => onChange({ pointDeRepere: value.pointDeRepere })}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={localisation}
          onClick={async () => {
            setLocalisation(true);
            try {
              const position = await lirePositionGps();
              onChange({ ...value, latitude: position.latitude, longitude: position.longitude });
            } catch (error) {
              toast.error((error as Error).message);
            } finally {
              setLocalisation(false);
            }
          }}
        >
          <LocateFixed className="size-4" aria-hidden="true" />
          {localisation ? 'Localisation...' : 'Ajouter ma position GPS'}
        </Button>
      )}
    </div>
  );
}
