import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { getPlatImage } from '@/data/images';
import { formatPrixFcfa } from '@/lib/format';
import type { Plat } from '@/api/types';

/**
 * Dish row of the menu: text on the left, photo on the right with the add
 * button or quantity stepper pinned under it. Rows are separated by the
 * parent's rules, not boxed.
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
    <article className={cn('flex items-start justify-between gap-4 py-4', !plat.disponible && 'opacity-60')}>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-base leading-snug font-bold">{plat.nom}</h3>
        {plat.description && (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{plat.description}</p>
        )}
        <p className="flex items-center gap-2 pt-1 text-[15px] font-bold tabular-nums">
          {formatPrixFcfa(plat.prix)}
          {quantite > 0 && <span className="text-sm font-semibold text-primary">· {quantite} au panier</span>}
        </p>
      </div>

      <div className="relative shrink-0 pb-4">
        <MediaFrame
          nom={plat.nom}
          image={plat.photoUrl ?? getPlatImage(plat.nom)}
          ratio="square"
          className="size-24 rounded-xl sm:size-28"
        />

        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          {!commandable ? null : !plat.disponible ? (
            <span className="rounded-full bg-card px-2.5 py-1 text-xs font-bold text-muted-foreground shadow-md">
              Épuisé
            </span>
          ) : quantite > 0 ? (
            <div className="flex h-9 items-center rounded-full bg-primary text-primary-foreground shadow-md">
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center"
                aria-label={quantite === 1 ? `Retirer ${plat.nom} du panier` : `Un ${plat.nom} de moins`}
                onClick={() => onRetirer(plat)}
              >
                <Minus className="size-4" strokeWidth={2.5} aria-hidden="true" />
              </button>
              <span className="w-5 text-center text-sm font-bold tabular-nums" aria-live="polite">
                {quantite}
              </span>
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center"
                aria-label={`Un ${plat.nom} de plus`}
                onClick={() => onAjouter(plat)}
              >
                <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex h-9 cursor-pointer items-center gap-1 rounded-full bg-card px-3.5 text-sm font-bold text-primary shadow-md hover:bg-accent"
              aria-label={`Ajouter ${plat.nom} au panier`}
              onClick={() => onAjouter(plat)}
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
              Ajouter
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
