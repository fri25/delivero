import { Minus, Plus, Trash2 } from 'lucide-react';
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
          variant="outline"
          size="icon-sm"
          aria-label="Diminuer la quantité"
          onClick={() => onUpdateQuantity(item.platId, item.quantite - 1)}
        >
          <Minus className="size-3" />
        </Button>
        <span className="w-6 text-center">{item.quantite}</span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Augmenter la quantité"
          onClick={() => onUpdateQuantity(item.platId, item.quantite + 1)}
        >
          <Plus className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Retirer du panier"
          onClick={() => onRemove(item.platId)}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
