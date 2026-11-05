import { LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DisponibiliteToggle } from '@/components/layout/DisponibiliteToggle';
import { useAuthStore } from '@/stores/auth-store';
import { desactiverPush } from '@/lib/push';
import { useFileActionsStore } from '@/stores/file-actions-store';
import { useEntreprise } from '@/lib/entreprise';
import { decouperNom } from '@delivero/config/entreprise';

/**
 * Brand, availability switch and sign-out. Navigation lives in the bottom
 * tab bar (BottomNav): one tap from the thumb, on every screen size.
 */
export function Header() {
  const entreprise = useEntreprise();
  const [debutNom, finNom] = decouperNom(entreprise.nomCommercial);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card text-foreground">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
        <Link to="/" className="min-w-0 focus-visible:outline-none">
          <span className="block font-heading text-xl leading-none font-extrabold tracking-[-0.03em]">
            {debutNom}
            {finNom && <span className="text-primary">{finNom}</span>}
          </span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">{user ? user.nom : 'Espace livreur'}</span>
        </Link>

        {user ? (
          <div className="flex shrink-0 items-center gap-1">
            <DisponibiliteToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Déconnexion"
              className="size-10 text-muted-foreground hover:text-foreground"
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
        ) : null}
      </div>
    </header>
  );
}
