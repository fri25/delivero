import { History, Home, ShoppingCart, UserRound, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { estPageAvecBarre } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';

const ONGLETS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/repas', label: 'Repas', icon: UtensilsCrossed },
  { to: '/commandes', label: 'Commandes', icon: History },
  { to: '/panier', label: 'Panier', icon: ShoppingCart },
  { to: '/compte', label: 'Compte', icon: UserRound },
];

/** Mobile bottom tab bar: active tab marked by a blue top rule, cart count in red. */
export function BottomNav() {
  const { pathname } = useLocation();
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantite, 0));

  if (!estPageAvecBarre(pathname)) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ONGLETS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  '-mt-px flex min-h-14 flex-col items-center justify-center gap-0.5 border-t-2 text-[11px]',
                  isActive ? 'border-primary font-bold text-primary' : 'border-transparent font-medium text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className="size-5.5" strokeWidth={isActive ? 2 : 1.75} aria-hidden="true" />
                    {to === '/panier' && itemCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 rounded-lg bg-brand-red px-1 text-center text-[11px] leading-4 font-bold text-white tabular-nums">
                        {itemCount}
                      </span>
                    )}
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
