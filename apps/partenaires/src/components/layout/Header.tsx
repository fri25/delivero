import { LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { OuvertureToggle } from '@/components/layout/OuvertureToggle';
import { SonBouton } from '@/components/layout/SonBouton';
import { useMonRestaurant } from '@/api/restaurant';
import { useAuthStore } from '@/stores/auth-store';
import { desactiverPush } from '@/lib/push';
import { useEntreprise } from '@/lib/entreprise';
import { decouperNom } from '@delivero/config/entreprise';

/**
 * Restaurant name, open/closed switch, sound unlock and sign-out. Navigation
 * lives in the bottom tab bar (BottomNav).
 */
export function Header() {
  const entreprise = useEntreprise();
  const [debutNom, finNom] = decouperNom(entreprise.nomCommercial);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const { data: restaurant } = useMonRestaurant();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card text-foreground">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link to="/" className="min-w-0">
          {user && restaurant ? (
            <>
              <span className="block truncate text-lg leading-tight font-extrabold tracking-tight">{restaurant.nom}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {debutNom}
                {finNom && <span className="font-semibold">{finNom}</span>} · Partenaire
              </span>
            </>
          ) : (
            <span className="block font-heading text-xl leading-none font-extrabold tracking-[-0.03em]">
              {debutNom}
              {finNom && <span className="text-primary">{finNom}</span>}
            </span>
          )}
        </Link>

        {user ? (
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <SonBouton />
            <OuvertureToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Déconnexion"
              className="size-10 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (token) void desactiverPush(token);
                logout();
                navigate('/connexion');
              }}
              title="Se déconnecter"
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
