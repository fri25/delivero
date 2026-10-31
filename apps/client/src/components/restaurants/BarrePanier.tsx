import { ArrowRight, ShoppingBag, ShoppingCart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatPrixFcfa } from '@/lib/format';
import type { CartItem } from '@/stores/cart-store';

/**
 * Cart summary on the restaurant page.
 * Mobile: floating blue bottom pill.
 * Desktop: sticky side panel listing dishes and subtotal.
 */
export function BarrePanier({ items }: { items: CartItem[] }) {
  const nombre = items.reduce((total, item) => total + item.quantite, 0);
  const sousTotal = items.reduce((total, item) => total + item.prixUnitaire * item.quantite, 0);

  if (nombre === 0) {
    return (
      <aside className="hidden rounded-3xl bg-card p-6 text-center border border-dashed border-border lg:block">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShoppingCart className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-3 font-heading font-bold text-foreground">Votre panier est vide</p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Sélectionnez de délicieux plats pour commencer votre commande.
        </p>
      </aside>
    );
  }

  return (
    <>
      <aside className="hidden space-y-4 rounded-3xl bg-card p-6 ring-1 ring-border shadow-lg shadow-primary/5 lg:block">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="size-4" />
            </span>
            <h2 className="font-heading text-base font-bold text-foreground">Votre commande</h2>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {nombre} article{nombre > 1 ? 's' : ''}
          </span>
        </div>

        <ul className="divide-y divide-border/50 text-sm max-h-72 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {items.map((item) => (
            <li key={item.platId} className="flex justify-between items-center gap-3 py-2.5 first:pt-0">
              <div className="min-w-0 truncate">
                <span className="font-bold text-primary mr-2 tabular-nums">{item.quantite}×</span>
                <span className="font-medium text-foreground">{item.nom}</span>
              </div>
              <span className="shrink-0 font-bold tabular-nums text-foreground">
                {formatPrixFcfa(item.prixUnitaire * item.quantite)}
              </span>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-border/70 pt-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-heading text-lg font-bold tabular-nums text-primary">
              {formatPrixFcfa(sousTotal)}
            </span>
          </div>

          <div className="rounded-xl bg-secondary/50 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <span>Livraison rapide par coursier ChapExpress</span>
          </div>
        </div>

        <Button asChild size="lg" className="w-full rounded-2xl shadow-md shadow-primary/20 font-bold gap-2 text-base h-12">
          <Link to="/panier">
            <span>Passer commande</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </aside>

      <div className="h-20 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden animate-in slide-in-from-bottom-4 duration-200">
        <Link
          to="/panier"
          className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 rounded-full bg-primary px-2.5 pr-4 text-primary-foreground shadow-xl shadow-primary/30 transition-transform duration-150 active:scale-[0.98]"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-sm font-black text-primary">
              {nombre}
            </span>
            <span className="font-heading font-bold text-sm tracking-wide">Voir le panier</span>
          </div>
          <div className="flex items-center gap-2 font-heading font-bold text-sm tabular-nums">
            <span>{formatPrixFcfa(sousTotal)}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </div>
        </Link>
      </div>
    </>
  );
}
