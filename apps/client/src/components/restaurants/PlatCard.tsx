import { UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrixFcfa } from '@/lib/format';
import type { Plat } from '@/api/types';

export function PlatCard({ plat, onAjouter }: { plat: Plat; onAjouter: (plat: Plat) => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      {plat.photoUrl ? (
        <img
          src={plat.photoUrl}
          alt=""
          loading="lazy"
          className="size-14 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <UtensilsCrossed className="size-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-medium">{plat.nom}</p>
        {plat.description && <p className="line-clamp-1 text-sm text-muted-foreground">{plat.description}</p>}
        <p className="text-sm font-medium text-primary">{formatPrixFcfa(plat.prix)}</p>
      </div>

      <Button size="sm" disabled={!plat.disponible} onClick={() => onAjouter(plat)}>
        {plat.disponible ? 'Ajouter' : 'Indisponible'}
      </Button>
    </div>
  );
}
