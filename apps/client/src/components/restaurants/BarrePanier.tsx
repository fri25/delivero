import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatPrixFcfa } from '@/lib/format';
import type { CartItem } from '@/stores/cart-store';

/**
 * Cart summary on the restaurant page, shown as soon as one dish is in.
 * Mobile: fixed bottom bar. Desktop: sticky side panel listing the dishes.
 */
export function BarrePanier({ items }: { items: CartItem[] }) {
  const nombre = items.reduce((total, item) => total + item.quantite, 0);
  const sousTotal = items.reduce((total, item) => total + item.prixUnitaire * item.quantite, 0);

  if (nombre === 0) {
    return (
      <aside className="hidden rounded-2xl bg-card p-5 text-center ring-1 ring-foreground/10 lg:block">
        <ShoppingCart className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <p className="mt-2 font-semibold">Votre panier est vide</p>
        <p className="text-sm text-muted-foreground">Ajoutez des plats avec le bouton +.</p>
      </aside>
    );
  }

  return (
    <>
      <aside className="hidden space-y-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 lg:block">
        <h2 className="font-heading text-lg font-semibold">Votre panier</h2>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.platId} className="flex justify-between gap-3">
              <span>
                <span className="font-semibold text-primary">{item.quantite} ×</span> {item.nom}
              </span>
              <span className="shrink-0">{formatPrixFcfa(item.prixUnitaire * item.quantite)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Sous-total</span>
          <span className="font-heading text-lg font-semibold">{formatPrixFcfa(sousTotal)}</span>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link to="/panier">Voir le panier et commander</Link>
        </Button>
      </aside>

      {/* Mobile: spacer so the last dish is not hidden by the fixed bar. */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <Link
          to="/panier"
          className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 rounded-2xl bg-primary px-4 text-primary-foreground shadow-lg"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">{nombre}</span>
          <span className="font-semibold">Voir le panier</span>
          <span className="font-semibold">{formatPrixFcfa(sousTotal)}</span>
        </Link>
      </div>
    </>
  );
}
