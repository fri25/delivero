import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { getPlatImage } from '@/data/images';
import { formatPrixFcfa } from '@/lib/format';
import type { Plat } from '@/api/types';

/**
 * One dish of the menu. Once in the cart, the add button turns into a
 * quantity stepper: the user sees what they already took without opening
 * the cart.
 */
export function PlatCard({
  plat,
  quantite,
  commandable = true,
  onAjouter,
  onRetirer,
}: {
  plat: Plat;
  quantite: number;
  /** False when the restaurant is closed: the menu stays readable. */
  commandable?: boolean;
  onAjouter: (plat: Plat) => void;
  onRetirer: (plat: Plat) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="size-20 shrink-0 overflow-hidden rounded-xl">
        <MediaFrame nom={plat.nom} image={plat.photoUrl ?? getPlatImage(plat.nom)} ratio="square" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{plat.nom}</p>
        {plat.description && <p className="line-clamp-2 text-sm text-muted-foreground">{plat.description}</p>}
        <p className="mt-0.5 text-sm font-semibold text-primary">{formatPrixFcfa(plat.prix)}</p>
      </div>

      {!commandable ? null : !plat.disponible ? (
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Épuisé</span>
      ) : quantite > 0 ? (
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary p-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label={quantite === 1 ? `Retirer ${plat.nom} du panier` : `Un ${plat.nom} de moins`}
            onClick={() => onRetirer(plat)}
          >
            <Minus />
          </Button>
          <span className="w-5 text-center text-sm font-semibold" aria-live="polite">
            {quantite}
          </span>
          <Button size="icon-sm" className="rounded-full" aria-label={`Un ${plat.nom} de plus`} onClick={() => onAjouter(plat)}>
            <Plus />
          </Button>
        </div>
      ) : (
        <Button size="icon" className="shrink-0 rounded-full" aria-label={`Ajouter ${plat.nom} au panier`} onClick={() => onAjouter(plat)}>
          <Plus className="size-5" />
        </Button>
      )}
    </div>
  );
}
