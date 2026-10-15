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
    <header className="sticky top-0 z-20 bg-brand-navy border-b border-white/10 text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none">
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-[#002b66] shadow-sm ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-white stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-lg font-bold tracking-tight text-white leading-none">
                Chap<span className="text-[#4aa3ea]">Express</span>
              </span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                Livreur
              </span>
            </div>
            {user && (
              <span className="text-[11px] text-white/70 font-medium leading-tight truncate max-w-[120px] sm:max-w-[180px]">
                {user.nom}
              </span>
            )}
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <DisponibiliteToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Déconnexion"
              className="size-9 rounded-full text-white/80 hover:bg-white/15 hover:text-white"
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
              <LogOut className="size-4.5" />
            </Button>
          </div>
        ) : (
          <Button asChild size="sm" className="rounded-full font-semibold">
            <Link to="/connexion">Connexion</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
