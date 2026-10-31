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

/** Mobile bottom tab bar: active tab in blue, cart count in red. */
export function BottomNav() {
  const { pathname } = useLocation();
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantite, 0));

  if (!estPageAvecBarre(pathname)) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-1 py-1">
        {ONGLETS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex min-h-[3.6rem] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all duration-200 active:scale-95',
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'relative flex size-8 items-center justify-center rounded-full transition-all duration-200',
                      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('size-4.5 transition-transform', isActive && 'stroke-[2.5]')} aria-hidden="true" />
                    {to === '/panier' && itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white ring-2 ring-card animate-in zoom-in-50">
                        {itemCount}
                      </span>
                    )}
                  </span>
                  <span className={cn('leading-tight', isActive ? 'text-primary font-bold' : '')}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
