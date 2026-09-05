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
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div>
        <p className="font-medium">{item.nom}</p>
        <p className="text-sm text-muted-foreground">{formatPrixFcfa(item.prixUnitaire)} / unité</p>
        {item.instructions && <p className="text-sm text-muted-foreground">« {item.instructions} »</p>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={item.quantite <= 1 ? 'Retirer du panier' : 'Diminuer la quantité'}
          onClick={() =>
            item.quantite <= 1
              ? onRemove(item.platId)
              : onUpdateQuantity(item.platId, item.quantite - 1)
          }
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-8 text-center text-lg font-semibold">{item.quantite}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Augmenter la quantité"
          onClick={() => onUpdateQuantity(item.platId, item.quantite + 1)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
