import { LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { OuvertureToggle } from '@/components/layout/OuvertureToggle';
import { SonBouton } from '@/components/layout/SonBouton';
import { useMonRestaurant } from '@/api/restaurant';
import { useAuthStore } from '@/stores/auth-store';
import { desactiverPush } from '@/lib/push';

/**
 * Restaurant name, open/closed switch, sound unlock and sign-out. Navigation
 * lives in the bottom tab bar (BottomNav).
 */
export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const { data: restaurant } = useMonRestaurant();

  return (
    <header className="sticky top-0 z-20 bg-brand-navy text-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/" className="min-w-0 text-white">
          <span className="block truncate font-heading text-lg leading-tight font-semibold tracking-tight">
            {user && restaurant ? restaurant.nom : 'ChapExpress'}
          </span>
          <span className="block truncate text-xs leading-tight text-white/60">ChapExpress Partenaires</span>
        </Link>

        {user ? (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <SonBouton />
            <OuvertureToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Déconnexion"
              className="text-white/90 hover:bg-white/10 hover:text-white"
              onClick={() => {
                if (token) void desactiverPush(token);
                logout();
                navigate('/connexion');
              }}
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link to="/connexion">Connexion</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
