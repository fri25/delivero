import { Bike, History, Inbox, Wallet, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ONGLETS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'À prendre', icon: Inbox, end: true },
  { to: '/en-cours', label: 'En cours', icon: Bike },
  { to: '/historique', label: 'Historique', icon: History },
  { to: '/portefeuille', label: 'Portefeuille', icon: Wallet },
];

/**
 * Tab bar, on every screen size: the livreur app is used on a phone, often
 * one-handed on a moto stop. Replaces the 7 per-service links of the header.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/90 pb-[max(0.6rem,env(safe-area-inset-bottom))] backdrop-blur-xl shadow-lg"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 px-2 pt-1">
        {ONGLETS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[11px] font-semibold transition-all duration-200 active:scale-95',
                  isActive
                    ? 'text-primary bg-primary/10 font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('size-5 transition-transform duration-200', isActive && 'stroke-[2.5] scale-110')} aria-hidden="true" />
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
