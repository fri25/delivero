import { LogOut, Store } from 'lucide-react';
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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-brand-navy text-white shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 text-white group">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-blue to-cyan-400 text-white shadow-sm ring-1 ring-white/20 transition-transform group-hover:scale-105">
            <Store className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="block truncate font-heading text-base font-bold tracking-tight text-white">
                {user && restaurant ? restaurant.nom : 'ChapExpress'}
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 ring-1 ring-cyan-400/30">
                Partenaire
              </span>
            </div>
            <span className="block truncate text-xs text-white/70">
              {restaurant?.specialiteCuisine || 'Espace Restaurant'}
            </span>
          </div>
        </Link>

        {user ? (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <SonBouton />
            <OuvertureToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Déconnexion"
              className="size-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => {
                if (token) void desactiverPush(token);
                logout();
                navigate('/connexion');
              }}
              title="Se déconnecter"
            >
              <LogOut className="size-4.5" />
            </Button>
          </div>
        ) : (
          <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white font-medium">
            <Link to="/connexion">Connexion</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
