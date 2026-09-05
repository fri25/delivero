import { LogOut } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useMoi, useToggleDisponibilite } from '@/api/livreur';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

function DisponibiliteToggle() {
  const { data: livreur } = useMoi();
  const toggleDisponibilite = useToggleDisponibilite();

  if (!livreur) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant={livreur.disponible ? 'default' : 'outline'}
      className={livreur.disponible ? 'bg-success hover:bg-success/85' : ''}
      disabled={toggleDisponibilite.isPending}
      onClick={() => {
        toggleDisponibilite.mutate(!livreur.disponible, {
          onSuccess: (data) =>
            toast.success(data.disponible ? 'Vous êtes disponible.' : 'Vous êtes indisponible.'),
          onError: (error) => toast.error(error.message),
        });
      }}
    >
      {livreur.disponible ? 'Disponible' : 'Indisponible'}
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
          <span className="text-sm font-normal text-white/60">Livreur</span>
        </Link>

        {user && (
          <nav className="hidden items-center gap-4 text-sm lg:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Courses disponibles
            </NavLink>
            <NavLink
              to="/mes-courses"
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Mes courses
            </NavLink>
            <NavLink
              to="/colis"
              end
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Colis disponibles
            </NavLink>
            <NavLink
              to="/colis/mes-courses"
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Mes colis
            </NavLink>
            <NavLink
              to="/emplettes"
              end
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Emplettes disponibles
            </NavLink>
            <NavLink
              to="/emplettes/mes-courses"
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Mes emplettes
            </NavLink>
            <NavLink
              to="/courses-express"
              end
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Courses express disponibles
            </NavLink>
            <NavLink
              to="/courses-express/mes-courses"
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Mes courses express
            </NavLink>
            <NavLink
              to="/portefeuille"
              className={({ isActive }) =>
                cn('text-white/75 hover:text-white', isActive && 'font-medium text-white')
              }
            >
              Mon portefeuille
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <DisponibiliteToggle />
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
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 px-4 py-2 text-sm lg:hidden">
          <NavLink
            to="/"
            end
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Courses disponibles
          </NavLink>
          <NavLink
            to="/mes-courses"
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Mes courses
          </NavLink>
          <NavLink
            to="/colis"
            end
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Colis disponibles
          </NavLink>
          <NavLink
            to="/colis/mes-courses"
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Mes colis
          </NavLink>
          <NavLink
            to="/emplettes"
            end
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Emplettes disponibles
          </NavLink>
          <NavLink
            to="/emplettes/mes-courses"
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Mes emplettes
          </NavLink>
          <NavLink
            to="/courses-express"
            end
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Courses express disponibles
          </NavLink>
          <NavLink
            to="/courses-express/mes-courses"
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Mes courses express
          </NavLink>
          <NavLink
            to="/portefeuille"
            className={({ isActive }) => cn('text-white/75', isActive && 'font-medium text-white')}
          >
            Mon portefeuille
          </NavLink>
        </nav>
      )}
    </header>
  );
}
