import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrixFcfa } from '@/lib/format';
import type { CartItem } from '@/stores/cart-store';

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (platId: string, quantite: number) => void;
  onRemove: (platId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm sm:text-base font-bold text-foreground leading-snug">{item.nom}</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {formatPrixFcfa(item.prixUnitaire)} × {item.quantite} ={' '}
          <span className="font-semibold text-foreground">{formatPrixFcfa(item.prixUnitaire * item.quantite)}</span>
        </p>
        {item.instructions && <p className="text-xs text-muted-foreground italic mt-0.5">« {item.instructions} »</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 p-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7 rounded-full bg-card hover:bg-primary/20 text-primary shadow-xs"
          aria-label={item.quantite <= 1 ? `Retirer ${item.nom} du panier` : `Un ${item.nom} de moins`}
          onClick={() =>
            item.quantite <= 1 ? onRemove(item.platId) : onUpdateQuantity(item.platId, item.quantite - 1)
          }
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="w-5 text-center text-xs sm:text-sm font-bold text-primary" aria-live="polite">
          {item.quantite}
        </span>
        <Button
          size="icon-sm"
          className="size-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          aria-label={`Un ${item.nom} de plus`}
          onClick={() => onUpdateQuantity(item.platId, item.quantite + 1)}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
