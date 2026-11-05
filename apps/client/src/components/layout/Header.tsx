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
import { useEntreprise } from '@/lib/entreprise';
import { codeService, decouperNom, estOuvert } from '@delivero/config/entreprise';

// Active link: ink + underline, no filled pill.
const lienDesktop = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-11 items-center text-[15px] font-semibold underline-offset-[6px] decoration-2 transition-colors',
    isActive ? 'text-foreground underline decoration-primary' : 'text-foreground/75 hover:text-foreground',
  );

// Desktop has room for direct links to each service: one click from any page.
const SERVICES = [
  { to: '/repas', label: 'Repas' },
  { to: '/colis', label: 'Colis' },
  { to: '/courses-express', label: 'Courses express' },
  ...(EMPLETTES_ACTIF ? [{ to: '/emplettes', label: 'Emplettes' }] : []),
];

export function Header() {
  const entreprise = useEntreprise();
  const [debutNom, finNom] = decouperNom(entreprise.nomCommercial);
  const services = SERVICES.filter((service) => estOuvert(entreprise, codeService(service.to)));
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
    <header className="sticky top-0 z-20 border-b border-border bg-card text-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:h-17 md:gap-8 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-1 md:gap-8">
          {/* Mobile only: on desktop the browser's back button does the job. */}
          {avecRetour && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Retour"
              className="-ml-2 size-11 text-foreground hover:bg-secondary md:hidden"
              onClick={retour}
            >
              <ArrowLeft className="size-5" />
            </Button>
          )}

          <Link
            to="/"
            className="shrink-0 font-heading text-xl leading-none font-extrabold tracking-[-0.03em] md:text-[22px]"
          >
            {debutNom}
            {finNom && <span className="text-primary">{finNom}</span>}
          </Link>

          {/* The home hero carries its own zone picker. */}
          {pathname !== '/' && <QuartierSelectorDialog className="hidden md:flex" />}
        </div>

        <nav aria-label="Navigation principale" className="hidden flex-1 items-center gap-6 md:flex">
          {services.map((service) => (
            <NavLink key={service.to} to={service.to} className={lienDesktop}>
              {service.label}
            </NavLink>
          ))}
          <span className="flex-1" aria-hidden="true" />
          <NavLink to="/commandes" className={lienDesktop}>
            Mes commandes
          </NavLink>
          <PanierLien itemCount={itemCount} />
          {user ? (
            <NavLink to="/compte" className={lienDesktop}>
              <span className="max-w-[10rem] truncate">{user.nom}</span>
            </NavLink>
          ) : (
            <Button asChild className="h-10 bg-foreground px-4 font-bold text-background hover:bg-foreground/90">
              <Link to="/connexion">Se connecter</Link>
            </Button>
          )}
        </nav>

        {panierMobile && (
          <div className="-mr-2 md:hidden">
            <PanierLien itemCount={itemCount} />
          </div>
        )}
      </div>

    </header>
  );
}
