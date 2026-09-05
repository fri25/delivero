import { LogOut } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useMonRestaurant, useToggleOuverture } from '@/api/restaurant';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

function OuvertureToggle() {
  const { data: restaurant } = useMonRestaurant();
  const toggleOuverture = useToggleOuverture();

  if (!restaurant) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant={restaurant.statutOuverture ? 'default' : 'outline'}
      className={restaurant.statutOuverture ? 'bg-success hover:bg-success/85' : ''}
      disabled={toggleOuverture.isPending}
      onClick={() => {
        toggleOuverture.mutate(!restaurant.statutOuverture, {
          onSuccess: (data) =>
            toast.success(data.statutOuverture ? 'Restaurant ouvert.' : 'Restaurant fermé.'),
          onError: (error) => toast.error(error.message),
        });
      }}
    >
      {restaurant.statutOuverture ? 'Ouvert' : 'Fermé'}
    </Button>
  );
}

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="bg-brand-navy text-white">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          ChapExpress{' '}
          <span className="text-sm font-normal text-white/60">Partenaires</span>
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
              Commandes
            </NavLink>
            <NavLink
              to="/menu"
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Menu
            </NavLink>
            <NavLink
              to="/parametres"
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Paramètres
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <OuvertureToggle />
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
            <Button asChild size="sm">
              <Link to="/connexion">Connexion</Link>
            </Button>
          )}
        </div>
      </div>

      {user && (
        <nav className="flex items-center gap-4 border-t border-white/10 px-4 py-2 text-sm sm:hidden">
          <NavLink
            to="/"
            end
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Commandes
          </NavLink>
          <NavLink
            to="/menu"
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Menu
          </NavLink>
          <NavLink
            to="/parametres"
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Paramètres
          </NavLink>
        </nav>
      )}
    </header>
  );
}
