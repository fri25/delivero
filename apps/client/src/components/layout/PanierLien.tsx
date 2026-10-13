import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Cart shortcut of the navy header, with its item count. */
export function PanierLien({ itemCount }: { itemCount: number }) {
  return (
    <Link
      to="/panier"
      className="relative flex size-11 items-center justify-center text-white/90 hover:text-white"
      aria-label={itemCount > 0 ? `Panier, ${itemCount} article${itemCount > 1 ? 's' : ''}` : 'Panier'}
    >
      <ShoppingCart className="size-5" />
      {itemCount > 0 && (
        <span className="absolute top-1 right-0.5 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-brand-navy">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
