import {
  BarChart3,
  Bike,
  ClipboardList,
  HandCoins,
  Map,
  MapPin,
  PhoneCall,
  Store,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Lien {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const GROUPES: { titre: string; liens: Lien[] }[] = [
  {
    titre: 'Pilotage',
    liens: [
      { to: '/', label: 'Tableau de bord', icon: BarChart3, end: true },
      { to: '/commandes', label: 'Commandes', icon: ClipboardList },
      { to: '/saisie-manuelle', label: 'Saisie manuelle', icon: PhoneCall },
    ],
  },
  {
    titre: 'Argent',
    liens: [
      { to: '/remboursements', label: 'Remboursements', icon: HandCoins },
      { to: '/caisse', label: 'Caisse', icon: Wallet },
    ],
  },
  {
    titre: 'Réseau',
    liens: [
      { to: '/restaurants', label: 'Restaurants', icon: Store },
      { to: '/livreurs', label: 'Livreurs', icon: Bike },
      { to: '/quartiers', label: 'Quartiers', icon: MapPin },
      { to: '/zones', label: 'Zones', icon: Map },
    ],
  },
];

function Lien({ lien, badge, compact }: { lien: Lien; badge?: number; compact?: boolean }) {
  const Icone = lien.icon;
  return (
    <NavLink
      to={lien.to}
      end={lien.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
          compact ? 'h-9 px-3' : 'h-10 px-3',
          isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )
      }
    >
      <Icone className="size-4 shrink-0" aria-hidden="true" />
      {lien.label}
      {badge ? (
        <span className="ml-auto rounded-full bg-destructive px-1.5 text-xs font-bold text-white tabular-nums">
          {badge}
          <span className="sr-only"> à traiter</span>
        </span>
      ) : null}
    </NavLink>
  );
}

/**
 * Back-office menu, grouped by job. Side column on a desktop (the
 * dispatcher's main screen), one scrolling row on a phone or a tablet.
 */
export function Navigation({ aRembourser }: { aRembourser: number }) {
  const badge = (to: string) => (to === '/remboursements' ? aRembourser : undefined);
  return (
    <>
      <nav aria-label="Navigation principale" className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20 space-y-5">
          {GROUPES.map((groupe) => (
            <div key={groupe.titre} className="space-y-1">
              <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{groupe.titre}</p>
              {groupe.liens.map((lien) => (
                <Lien key={lien.to} lien={lien} badge={badge(lien.to)} />
              ))}
            </div>
          ))}
        </div>
      </nav>
      <nav
        aria-label="Navigation principale"
        className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 pb-3 lg:hidden"
      >
        {GROUPES.flatMap((groupe) => groupe.liens).map((lien) => (
          <Lien key={lien.to} lien={lien} badge={badge(lien.to)} compact />
        ))}
      </nav>
    </>
  );
}
