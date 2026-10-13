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
      <div className="min-w-0">
        <p className="font-semibold leading-snug">{item.nom}</p>
        <p className="text-sm text-muted-foreground">
          {formatPrixFcfa(item.prixUnitaire)} × {item.quantite} ={' '}
          <span className="font-medium text-foreground">{formatPrixFcfa(item.prixUnitaire * item.quantite)}</span>
        </p>
        {item.instructions && <p className="text-sm text-muted-foreground">« {item.instructions} »</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary p-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label={item.quantite <= 1 ? `Retirer ${item.nom} du panier` : `Un ${item.nom} de moins`}
          onClick={() =>
            item.quantite <= 1 ? onRemove(item.platId) : onUpdateQuantity(item.platId, item.quantite - 1)
          }
        >
          <Minus />
        </Button>
        <span className="w-5 text-center text-sm font-semibold" aria-live="polite">
          {item.quantite}
        </span>
        <Button
          size="icon-sm"
          className="rounded-full"
          aria-label={`Un ${item.nom} de plus`}
          onClick={() => onUpdateQuantity(item.platId, item.quantite + 1)}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
