import { History, Home, ShoppingCart, UserRound, type LucideIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { estPageAvecBarre } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';

const ONGLETS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/commandes', label: 'Commandes', icon: History },
  { to: '/panier', label: 'Panier', icon: ShoppingCart },
  { to: '/compte', label: 'Compte', icon: UserRound },
];

/** Mobile tab bar, the usual pattern of delivery apps. Hidden from md up. */
export function BottomNav() {
  const { pathname } = useLocation();
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantite, 0));

  if (!estPageAvecBarre(pathname)) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl shadow-lg md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 px-2">
        {ONGLETS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex min-h-[4rem] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all duration-200 active:scale-95',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'relative flex size-9 items-center justify-center rounded-full transition-all duration-200',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('size-5 transition-transform', isActive && 'scale-105 stroke-[2.4]')} aria-hidden="true" />
                    {to === '/panier' && itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs ring-2 ring-card animate-in zoom-in-50">
                        {itemCount}
                      </span>
                    )}
                  </span>
                  <span className={cn('leading-none', isActive ? 'font-semibold text-primary' : '')}>
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
