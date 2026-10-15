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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl shadow-lg"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 py-1">
        {ONGLETS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[11px] font-medium transition-all active:scale-95',
                  isActive
                    ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className={cn('size-5 sm:size-5.5 transition-transform', isActive && 'stroke-[2.5] scale-110')} aria-hidden="true" />
                    {to === '/' && aAccepter > 0 && (
                      <span className="absolute -top-1.5 -right-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-xs">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-50" />
                        <span className="relative">{aAccepter}</span>
                      </span>
                    )}
                  </span>
                  <span className="leading-tight tracking-tight">{label}</span>
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
