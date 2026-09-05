import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealiserEtape } from '@/api/commandes-courses-express';
import { googleMapsRouteUrl } from '@/lib/format';
import type { EtapeCourseExpress } from '@/api/types';

export function EtapeRealisationRow({
  commandeId,
  etape,
  disabled,
}: {
  commandeId: string;
  etape: EtapeCourseExpress;
  disabled: boolean;
}) {
  const realiserEtape = useRealiserEtape();

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <div>
        <p className="text-sm font-medium">
          Étape {etape.ordre} — {etape.description}
        </p>
        <a
          href={googleMapsRouteUrl(etape.adresse ?? etape.pointDeRepere)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline"
        >
          {etape.pointDeRepere} <ExternalLink className="size-3" />
        </a>
      </div>

      {etape.realisee ? (
        <span className="shrink-0 text-xs font-medium text-brand-green">Réalisée</span>
      ) : (
        <Button
          size="sm"
          disabled={disabled || realiserEtape.isPending}
          onClick={() => {
            realiserEtape.mutate(
              { commandeId, etapeId: etape.id },
              { onError: (error) => toast.error(error.message) },
            );
          }}
        >
          Réaliser
        </Button>
      )}
    </div>
  );
}
