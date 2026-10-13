import { LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DisponibiliteToggle } from '@/components/layout/DisponibiliteToggle';
import { useAuthStore } from '@/stores/auth-store';
import { desactiverPush } from '@/lib/push';
import { useFileActionsStore } from '@/stores/file-actions-store';

/**
 * Brand, availability switch and sign-out. Navigation lives in the bottom
 * tab bar (BottomNav): one tap from the thumb, on every screen size.
 */
export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-20 bg-brand-navy text-white">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <Link to="/" className="font-heading text-lg font-semibold tracking-tight text-white">
          ChapExpress <span className="text-sm font-normal text-white/60">Livreur</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <DisponibiliteToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Déconnexion"
              className="text-white/90 hover:bg-white/10 hover:text-white"
              onClick={() => {
                // Unsent offline actions only replay for their own account.
                const enAttente = useFileActionsStore
                  .getState()
                  .actions.filter((action) => action.userId === user?.id).length;
                if (
                  enAttente > 0 &&
                  !window.confirm(
                    `${enAttente} action(s) ne sont pas encore envoyées. Elles partiront à votre prochaine connexion sur ce téléphone. Se déconnecter quand même ?`,
                  )
                ) {
                  return;
                }
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
