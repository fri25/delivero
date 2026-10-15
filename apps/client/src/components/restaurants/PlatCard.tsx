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
    <div className="group flex items-center gap-3.5 rounded-2xl p-3 transition-all duration-200 hover:bg-secondary/40 border border-transparent hover:border-border/50">
      <div className="size-20 sm:size-22 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-2xs">
        <MediaFrame
          nom={plat.nom}
          image={plat.photoUrl ?? getPlatImage(plat.nom)}
          ratio="square"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
          {plat.nom}
        </p>
        {plat.description && (
          <p className="line-clamp-2 mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {plat.description}
          </p>
        )}
        <p className="mt-1 font-heading text-sm font-bold text-primary">
          {formatPrixFcfa(plat.prix)}
        </p>
      </div>

      {!commandable ? null : !plat.disponible ? (
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Épuisé
        </span>
      ) : quantite > 0 ? (
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 p-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 rounded-full bg-card hover:bg-primary/20 text-primary shadow-xs"
            aria-label={quantite === 1 ? `Retirer ${plat.nom} du panier` : `Un ${plat.nom} de moins`}
            onClick={() => onRetirer(plat)}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="w-5 text-center text-xs sm:text-sm font-bold text-primary" aria-live="polite">
            {quantite}
          </span>
          <Button
            size="icon-sm"
            className="size-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            aria-label={`Un ${plat.nom} de plus`}
            onClick={() => onAjouter(plat)}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          className="shrink-0 rounded-full px-3 h-8 shadow-xs font-semibold text-xs gap-1 active:scale-95 transition-all"
          aria-label={`Ajouter ${plat.nom} au panier`}
          onClick={() => onAjouter(plat)}
        >
          <Plus className="size-3.5" />
          <span>Ajouter</span>
        </Button>
      )}
    </div>
  );
}
