import {
  BarChart3,
  Bike,
  ClipboardList,
  HandCoins,
  History,
  Map,
  MapPin,
  PhoneCall,
  Settings,
  Store,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { usePeut } from '@/lib/permissions';
import { cn } from '@/lib/utils';

interface Lien {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Shown only to the roles holding it (étape 8). */
  permission: string;
  end?: boolean;
}

const GROUPES: { titre: string; liens: Lien[] }[] = [
  {
    titre: 'Pilotage',
    liens: [
      { to: '/', label: 'Tableau de bord', icon: BarChart3, permission: 'statistiques.consulter_tout', end: true },
      { to: '/commandes', label: 'Commandes', icon: ClipboardList, permission: 'commandes.consulter_toutes' },
      { to: '/saisie-manuelle', label: 'Saisie manuelle', icon: PhoneCall, permission: 'commandes.saisir_manuelle' },
    ],
  },
  {
    titre: 'Argent',
    liens: [
      { to: '/remboursements', label: 'Remboursements', icon: HandCoins, permission: 'paiements.rembourser' },
      { to: '/caisse', label: 'Caisse', icon: Wallet, permission: 'caisse.rapprocher' },
    ],
  },
  {
    titre: 'Réseau',
    liens: [
      { to: '/restaurants', label: 'Restaurants', icon: Store, permission: 'partenaires.gerer' },
      { to: '/livreurs', label: 'Livreurs', icon: Bike, permission: 'livreurs.gerer' },
      { to: '/quartiers', label: 'Quartiers', icon: MapPin, permission: 'zones.gerer' },
      { to: '/zones', label: 'Zones', icon: Map, permission: 'zones.gerer' },
    ],
  },
  {
    titre: 'Entreprise',
    liens: [
      { to: '/clients', label: 'Clients', icon: Users, permission: 'clients.consulter' },
      { to: '/utilisateurs', label: 'Utilisateurs', icon: UserCog, permission: 'entreprise.utilisateurs' },
      { to: '/journal', label: 'Journal', icon: History, permission: 'journal.consulter' },
      { to: '/reglages', label: 'Réglages', icon: Settings, permission: 'entreprise.parametres' },
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
          'flex items-center gap-3 rounded-2xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all active:scale-98',
          compact ? 'h-9 px-3.5' : 'h-10 px-3.5',
          isActive
            ? 'bg-primary/10 text-primary font-bold shadow-2xs'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )
      }
    >
      <Icone className="size-4 shrink-0 transition-transform" aria-hidden="true" />
      <span>{lien.label}</span>
      {badge ? (
        <span className="relative ml-auto flex items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-40" />
          <span className="relative rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-white tabular-nums shadow-xs">
            {badge}
            <span className="sr-only"> à traiter</span>
          </span>
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
  const peut = usePeut();
  const badge = (to: string) => (to === '/remboursements' ? aRembourser : undefined);
  const groupes = GROUPES.map((groupe) => ({
    ...groupe,
    liens: groupe.liens.filter((lien) => peut(lien.permission)),
  })).filter((groupe) => groupe.liens.length > 0);
  return (
    <>
      <nav aria-label="Navigation principale" className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 rounded-3xl border border-border/70 bg-card/70 p-3.5 shadow-xs backdrop-blur-md space-y-5">
          {groupes.map((groupe) => (
            <div key={groupe.titre} className="space-y-1">
              <p className="px-3.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{groupe.titre}</p>
              <div className="space-y-0.5">
                {groupe.liens.map((lien) => (
                  <Lien key={lien.to} lien={lien} badge={badge(lien.to)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <nav
        aria-label="Navigation principale"
        className="-mx-4 flex gap-1.5 overflow-x-auto border-b border-border/60 bg-card/60 px-4 py-2.5 backdrop-blur-md lg:hidden"
      >
        {groupes.flatMap((groupe) => groupe.liens).map((lien) => (
          <Lien key={lien.to} lien={lien} badge={badge(lien.to)} compact />
        ))}
      </nav>
    </>
  );
}
