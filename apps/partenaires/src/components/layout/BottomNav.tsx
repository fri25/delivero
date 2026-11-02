import { BarChart3, ClipboardList, Settings, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ONGLETS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Commandes', icon: ClipboardList, end: true },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/ventes', label: 'Ventes', icon: BarChart3 },
  { to: '/parametres', label: 'Réglages', icon: Settings },
];

/**
 * Tab bar on every screen size: the restaurant runs the app on a phone or a
 * tablet left on the counter, operated with greasy fingers — big targets.
 * Active tab: blue top rule, like the client and livreur apps.
 */
export function BottomNav({ aAccepter }: { aAccepter: number }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {ONGLETS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  '-mt-px flex min-h-16 flex-col items-center justify-center gap-1 border-t-2 text-xs',
                  isActive ? 'border-primary font-bold text-primary' : 'border-transparent font-medium text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className="size-6" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
                    {to === '/' && aAccepter > 0 && (
                      <span className="absolute -top-1.5 -right-3 h-5 min-w-5 rounded-full bg-brand-red px-1 text-center text-xs leading-5 font-bold text-white tabular-nums">
                        {aAccepter}
                      </span>
                    )}
                  </span>
                  <span>{label}</span>
                  {to === '/' && aAccepter > 0 && <span className="sr-only">({aAccepter} à accepter)</span>}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
