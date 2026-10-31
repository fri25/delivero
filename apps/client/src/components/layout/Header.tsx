import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { ArrowLeft } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PanierLien } from '@/components/layout/PanierLien';
import { QuartierSelectorDialog } from '@/components/layout/QuartierSelectorDialog';
import { estPageAvecBarre, estPageRacine } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';

const lienDesktop = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-secondary text-primary font-semibold'
      : 'text-foreground/70 hover:bg-secondary hover:text-foreground',
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
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 text-foreground backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 md:h-16 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Mobile only: on desktop the browser's back button does the job. */}
          {avecRetour ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Retour"
              className="size-9 rounded-full text-foreground hover:bg-secondary md:hidden"
              onClick={retour}
            >
              <ArrowLeft className="size-5" />
            </Button>
          ) : (
            <span className="w-0.5 md:hidden" aria-hidden="true" />
          )}

          <Link to="/" className="group flex items-center gap-2.5 transition-transform active:scale-98 shrink-0">
            <span className="relative flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground md:size-9">
              <svg viewBox="0 0 24 24" fill="none" className="size-4.5 md:size-5" aria-hidden="true">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-brand-red ring-2 ring-card" aria-hidden="true" />
            </span>
            <span className="hidden font-heading text-lg font-extrabold leading-none tracking-tight text-brand-navy min-[380px]:inline md:text-xl dark:text-foreground">
              Chap<span className="text-primary">Express</span>
            </span>
          </Link>

          <QuartierSelectorDialog />
        </div>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1.5 md:flex">
          {SERVICES.map((service) => (
            <NavLink key={service.to} to={service.to} className={lienDesktop}>
              {service.label}
            </NavLink>
          ))}
          <span className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
          <NavLink to="/commandes" className={lienDesktop}>
            Mes commandes
          </NavLink>
          <PanierLien itemCount={itemCount} />
          {user ? (
            <NavLink to="/compte" className={lienDesktop}>
              <span className="inline-flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {user.nom.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[10rem] truncate">{user.nom}</span>
              </span>
            </NavLink>
          ) : (
            <Button
              asChild
              size="sm"
              className="ml-2 rounded-full px-4 font-semibold transition-transform active:scale-95"
            >
              <Link to="/connexion">Se connecter</Link>
            </Button>
          )}
        </nav>

        {panierMobile && (
          <div className="pr-1 md:hidden">
            <PanierLien itemCount={itemCount} />
          </div>
        )}
      </div>
    </header>
  );
}
