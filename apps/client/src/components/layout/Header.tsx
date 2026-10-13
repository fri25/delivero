import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { ArrowLeft, UserRound } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PanierLien } from '@/components/layout/PanierLien';
import { estPageAvecBarre, estPageRacine } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';

const lienDesktop = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm transition-colors',
    isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/5 hover:text-white',
  );

// Desktop has room for direct links to each service: one click from any page.
const SERVICES = [
  { to: '/repas', label: 'Repas' },
  { to: '/colis', label: 'Colis' },
  { to: '/courses-express', label: 'Courses' },
  ...(EMPLETTES_ACTIF ? [{ to: '/emplettes', label: 'Emplettes' }] : []),
];

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantite, 0));

  const avecRetour = !estPageRacine(pathname);
  // On mobile the tab bar already carries the cart; elsewhere (restaurant,
  // forms) keep a shortcut as soon as the cart holds something.
  const panierMobile = !estPageAvecBarre(pathname) && itemCount > 0 && pathname !== '/panier';

  const retour = () => {
    // React Router stores the history index: idx 0 means the user landed
    // here directly (shared link), so "back" would leave the app.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/');
  };

  return (
    <header className="sticky top-0 z-20 bg-brand-navy text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-2 md:h-16 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-1">
          {/* Mobile only: on desktop the browser's back button does the job. */}
          {avecRetour ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Retour"
              className="text-white hover:bg-white/10 hover:text-white md:hidden"
              onClick={retour}
            >
              <ArrowLeft className="size-5" />
            </Button>
          ) : (
            <span className="w-2 md:hidden" aria-hidden="true" />
          )}
          <Link to="/" className="font-heading text-lg font-semibold tracking-tight text-white md:text-xl">
            ChapExpress
          </Link>
        </div>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
          {SERVICES.map((service) => (
            <NavLink key={service.to} to={service.to} className={lienDesktop}>
              {service.label}
            </NavLink>
          ))}
          <span className="mx-2 h-6 w-px bg-white/20" aria-hidden="true" />
          <NavLink to="/commandes" className={lienDesktop}>
            Mes commandes
          </NavLink>
          <PanierLien itemCount={itemCount} />
          {user ? (
            <NavLink to="/compte" className={lienDesktop}>
              <span className="inline-flex items-center gap-2">
                <UserRound className="size-4" aria-hidden="true" />
                {user.nom}
              </span>
            </NavLink>
          ) : (
            <Button asChild size="sm" className="ml-2 bg-white text-brand-navy hover:bg-white/90">
              <Link to="/connexion">Se connecter</Link>
            </Button>
          )}
        </nav>

        {panierMobile && (
          <div className="pr-2 md:hidden">
            <PanierLien itemCount={itemCount} />
          </div>
        )}
      </div>
    </header>
  );
}
