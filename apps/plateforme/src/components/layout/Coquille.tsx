import { Building2, History, LogOut } from 'lucide-react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const LIENS = [
  { to: '/', label: 'Entreprises', icon: Building2, end: true },
  { to: '/journal', label: 'Journal', icon: History, end: false },
];

/** Frame of every signed-in screen of the platform tool. */
export function Coquille() {
  const token = useAuthStore((state) => state.token);
  const operateur = useAuthStore((state) => state.operateur);
  const deconnecter = useAuthStore((state) => state.deconnecter);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <p className="font-heading text-lg font-extrabold tracking-tight">
              Rapid<span className="text-emerald-400">Liv</span>
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white/80">Plateforme</span>
            </p>
            <nav aria-label="Navigation principale" className="flex gap-1">
              {LIENS.map(({ to, label, icon: Icone, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors',
                      isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                    )
                  }
                >
                  <Icone className="size-4" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/80 sm:inline">{operateur?.nom}</span>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={deconnecter} aria-label="Se déconnecter">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
