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
 * one-handed on a moto stop. Active tab: blue top rule, like the client app.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
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
                  <Icon className="size-6" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
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
