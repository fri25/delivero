import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatPrixFcfa } from '@/lib/format';
import type { CartItem } from '@/stores/cart-store';

/**
 * Cart summary on the restaurant page.
 * Mobile: fixed blue bar at the bottom of the screen.
 * Desktop: sticky side panel listing dishes and subtotal.
 */
export function BarrePanier({ items }: { items: CartItem[] }) {
  const nombre = items.reduce((total, item) => total + item.quantite, 0);
  const sousTotal = items.reduce((total, item) => total + item.prixUnitaire * item.quantite, 0);

  if (nombre === 0) {
    return (
      <aside className="carte hidden p-5 lg:block">
        <h2 className="text-[17px] font-bold">Votre commande</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ajoutez des plats depuis le menu.</p>
      </aside>
    );
  }

  return (
    <>
      <aside className="carte hidden space-y-4 p-5 lg:block">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold">Votre commande</h2>
          <span className="text-sm text-muted-foreground">
            {nombre} article{nombre > 1 ? 's' : ''}
          </span>
        </div>

        <ul className="max-h-72 divide-y divide-border overflow-y-auto border-y border-border text-sm [scrollbar-width:thin]">
          {items.map((item) => (
            <li key={item.platId} className="flex items-baseline justify-between gap-3 py-2.5">
              <span className="min-w-0 truncate">
                <span className="mr-2 font-bold tabular-nums">{item.quantite}×</span>
                {item.nom}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatPrixFcfa(item.prixUnitaire * item.quantite)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Sous-total, hors livraison</span>
          <span className="text-lg font-bold tabular-nums">{formatPrixFcfa(sousTotal)}</span>
        </div>

        <Button asChild className="h-11 w-full text-[15px] font-bold">
          <Link to="/panier">Passer commande</Link>
        </Button>
      </aside>

      <div className="h-20 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <Link
          to="/panier"
          className="mx-auto flex h-12 max-w-lg items-center justify-between gap-3 rounded-xl bg-primary px-4 text-primary-foreground"
        >
          <span className="text-[15px] font-bold">
            Voir le panier · {nombre} article{nombre > 1 ? 's' : ''}
          </span>
          <span className="text-[15px] font-bold tabular-nums">{formatPrixFcfa(sousTotal)}</span>
        </Link>
      </div>
    </>
  );
}
