import { LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

/** Brand, signed-in name and sign-out; the menu lives in Navigation. */
export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-20 bg-brand-navy text-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          ChapExpress{' '}
          <span className="text-sm font-normal text-white/60">Admin</span>
        </Link>

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
            <Button asChild size="sm">
              <Link to="/connexion">Connexion</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
