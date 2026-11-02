import { Minus, Plus } from 'lucide-react';
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
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-base leading-snug font-bold">{item.nom}</p>
        <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
          {formatPrixFcfa(item.prixUnitaire)} × {item.quantite} ={' '}
          <span className="font-semibold text-foreground">{formatPrixFcfa(item.prixUnitaire * item.quantite)}</span>
        </p>
        {item.instructions && <p className="mt-0.5 text-sm text-muted-foreground italic">« {item.instructions} »</p>}
      </div>

      <div className="flex h-9 shrink-0 items-center rounded-md border-[1.5px] border-input">
        <button
          type="button"
          className="flex h-full w-9 cursor-pointer items-center justify-center hover:bg-secondary"
          aria-label={item.quantite <= 1 ? `Retirer ${item.nom} du panier` : `Un ${item.nom} de moins`}
          onClick={() =>
            item.quantite <= 1 ? onRemove(item.platId) : onUpdateQuantity(item.platId, item.quantite - 1)
          }
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <span className="w-6 text-center text-sm font-bold tabular-nums" aria-live="polite">
          {item.quantite}
        </span>
        <button
          type="button"
          className="flex h-full w-9 cursor-pointer items-center justify-center hover:bg-secondary"
          aria-label={`Un ${item.nom} de plus`}
          onClick={() => onUpdateQuantity(item.platId, item.quantite + 1)}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
