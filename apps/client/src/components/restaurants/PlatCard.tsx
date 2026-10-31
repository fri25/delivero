import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MediaFrame } from '@/components/restaurants/MediaFrame';
import { getPlatImage } from '@/data/images';
import { formatPrixFcfa } from '@/lib/format';
import type { Plat } from '@/api/types';

/**
 * Dish card: text on the left, photo on the right with the add button or
 * stepper pinned under it. Blue frame once the dish is in the cart.
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
    <article
      className={cn(
        'group relative flex items-start justify-between gap-3 rounded-3xl border bg-card p-3.5 transition-[border-color,box-shadow] duration-200 hover:shadow-md hover:shadow-primary/5 sm:gap-4 sm:p-4',
        quantite > 0 ? 'border-primary' : 'border-border hover:border-primary/30',
        !plat.disponible && 'bg-muted/40 opacity-60',
      )}
    >
      <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5 pr-2">
        <div className="flex items-start gap-2">
          <h3 className="font-heading text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
            {plat.nom}
          </h3>
        </div>

        {plat.description && (
          <p className="line-clamp-2 text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
            {plat.description}
          </p>
        )}

        <div className="pt-1 flex items-center gap-2">
          <span className="font-heading text-sm font-extrabold text-foreground tabular-nums sm:text-base">
            {formatPrixFcfa(plat.prix)}
          </span>
          {quantite > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              <ShoppingBag className="size-3" />
              <span>{quantite} au panier</span>
            </span>
          )}
        </div>
      </div>

      <div className="relative shrink-0 pb-3">
        <div className="size-24 overflow-hidden rounded-2xl bg-muted sm:size-28">
          <MediaFrame
            nom={plat.nom}
            image={plat.photoUrl ?? getPlatImage(plat.nom)}
            ratio="square"
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          {!commandable ? null : !plat.disponible ? (
            <span className="shrink-0 rounded-full bg-card px-2.5 py-0.5 text-[11px] font-semibold text-brand-red ring-1 ring-border">
              Épuisé
            </span>
          ) : quantite > 0 ? (
            <div className="flex items-center gap-1.5 rounded-full bg-primary p-0.5 text-primary-foreground shadow-md shadow-primary/30 ring-2 ring-card animate-in zoom-in-90 duration-150">
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors active:scale-90 cursor-pointer"
                aria-label={quantite === 1 ? `Retirer ${plat.nom} du panier` : `Un ${plat.nom} de moins`}
                onClick={() => onRetirer(plat)}
              >
                <Minus className="size-3.5 stroke-[2.5]" aria-hidden="true" />
              </button>
              <span className="w-5 text-center text-xs font-extrabold tabular-nums text-white" aria-live="polite">
                {quantite}
              </span>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors active:scale-90 cursor-pointer"
                aria-label={`Un ${plat.nom} de plus`}
                onClick={() => onAjouter(plat)}
              >
                <Plus className="size-3.5 stroke-[2.5]" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1 rounded-full px-3 text-xs font-bold shadow-md shadow-primary/30 ring-2 ring-card transition-transform duration-150 active:scale-95"
              aria-label={`Ajouter ${plat.nom} au panier`}
              onClick={() => onAjouter(plat)}
            >
              <Plus className="size-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Ajouter</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
