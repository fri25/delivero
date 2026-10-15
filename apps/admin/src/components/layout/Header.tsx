import { LogOut, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

/** Brand, signed-in name and sign-out; the menu lives in Navigation. */
export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-brand-navy text-white shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-blue to-cyan-400 text-white shadow-sm ring-1 ring-white/20 transition-transform group-hover:scale-105">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold tracking-tight text-white">ChapExpress</span>
              <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 ring-1 ring-cyan-400/30">
                Administration
              </span>
            </div>
            <span className="block text-[11px] text-white/60">Supervision & Gestion Natitingou</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-white">{user.nom}</span>
                <span className="text-[10px] text-white/60 capitalize">{user.role}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Déconnexion"
                className="size-9 rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                onClick={() => {
                  logout();
                  navigate('/connexion');
                }}
                title="Se déconnecter"
              >
                <LogOut className="size-4.5" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white font-medium">
              <Link to="/connexion">Connexion</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
