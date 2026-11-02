import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Cart shortcut of the header, with its item count. */
export function PanierLien({ itemCount }: { itemCount: number }) {
  return (
    <Link
      to="/panier"
      className="relative flex size-11 items-center justify-center text-foreground hover:text-primary"
      aria-label={itemCount > 0 ? `Panier, ${itemCount} article${itemCount > 1 ? 's' : ''}` : 'Panier'}
    >
      <ShoppingCart className="size-5.5" strokeWidth={1.75} />
      {itemCount > 0 && (
        <span className="absolute top-1.5 right-0.5 h-4 min-w-4 rounded-lg bg-brand-red px-1 text-center text-[11px] leading-4 font-bold text-white tabular-nums">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
