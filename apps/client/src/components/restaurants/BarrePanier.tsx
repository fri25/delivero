import { ArrowRight, ShoppingBag, ShoppingCart } from 'lucide-react';
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
      <aside className="hidden rounded-3xl bg-card p-6 text-center border border-border/70 shadow-xs lg:block">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShoppingCart className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-3 font-heading font-bold text-foreground">Votre panier est vide</p>
        <p className="mt-1 text-xs text-muted-foreground">Ajoutez des plats avec le bouton +.</p>
      </aside>
    );
  }

  return (
    <>
      <aside className="hidden space-y-4 rounded-3xl bg-card p-6 border border-border/70 shadow-sm lg:block">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            <h2 className="font-heading text-base font-bold text-foreground">Votre commande</h2>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {nombre} article{nombre > 1 ? 's' : ''}
          </span>
        </div>

        <ul className="divide-y divide-border/60 text-sm">
          {items.map((item) => (
            <li key={item.platId} className="flex justify-between items-center gap-3 py-2.5 first:pt-0">
              <span className="min-w-0 truncate">
                <span className="font-bold text-primary mr-1.5">{item.quantite}×</span>
                <span className="font-medium text-foreground">{item.nom}</span>
              </span>
              <span className="shrink-0 font-semibold text-foreground">
                {formatPrixFcfa(item.prixUnitaire * item.quantite)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between border-t border-border/70 pt-3">
          <span className="text-sm text-muted-foreground">Sous-total</span>
          <span className="font-heading text-lg font-bold text-primary">{formatPrixFcfa(sousTotal)}</span>
        </div>

        <Button asChild size="lg" className="w-full rounded-xl shadow-md shadow-primary/20 font-semibold gap-2">
          <Link to="/panier">
            <span>Passer commande</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </aside>

      {/* Mobile: spacer so the last dish is not hidden by the fixed bar. */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <Link
          to="/panier"
          className="mx-auto flex h-14 max-w-xl items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand-navy via-brand-blue to-primary px-4 text-white shadow-xl shadow-brand-blue/20 backdrop-blur-xl border border-white/20 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-navy shadow-xs">
              {nombre}
            </span>
            <span className="font-heading font-semibold text-sm">Voir le panier</span>
          </div>
          <div className="flex items-center gap-2 font-heading font-bold text-sm">
            <span>{formatPrixFcfa(sousTotal)}</span>
            <ArrowRight className="size-4 text-white/80" />
          </div>
        </Link>
      </div>
    </>
  );
}
