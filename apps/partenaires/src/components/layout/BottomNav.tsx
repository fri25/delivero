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
 */
export function BottomNav({ aAccepter }: { aAccepter: number }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ONGLETS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className={cn('size-6', isActive && 'stroke-[2.4]')} aria-hidden="true" />
                    {to === '/' && aAccepter > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-white">
                        {aAccepter}
                      </span>
                    )}
                  </span>
                  {label}
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
