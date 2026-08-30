import { LogOut } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="bg-brand-navy text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          Chap<span className="text-brand-green">Express</span>{' '}
          <span className="text-sm font-normal text-white/60">Admin</span>
        </Link>

        {user && (
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Vue d'ensemble
            </NavLink>
            <NavLink
              to="/livreurs"
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Livreurs
            </NavLink>
            <NavLink
              to="/zones"
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Zones
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-white/75 md:inline">{user.nom}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Déconnexion"
                className="text-white/90 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  logout();
                  navigate('/connexion');
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="bg-brand-green text-white hover:bg-brand-green/85">
              <Link to="/connexion">Connexion</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
