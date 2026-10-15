import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { ArrowLeft } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PanierLien } from '@/components/layout/PanierLien';
import { estPageAvecBarre, estPageRacine } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';

const lienDesktop = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-white/15 text-white shadow-xs font-semibold'
      : 'text-white/80 hover:bg-white/10 hover:text-white',
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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-brand-navy/95 text-white backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 md:h-16 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-1.5">
          {/* Mobile only: on desktop the browser's back button does the job. */}
          {avecRetour ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Retour"
              className="size-9 rounded-full text-white hover:bg-white/10 hover:text-white md:hidden"
              onClick={retour}
            >
              <ArrowLeft className="size-5" />
            </Button>
          ) : (
            <span className="w-1 md:hidden" aria-hidden="true" />
          )}

          <Link to="/" className="group flex items-center gap-2.5 transition-transform active:scale-98">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-[#002b66] text-white shadow-xs ring-1 ring-white/20 transition-all duration-300 group-hover:ring-white/40 md:size-9">
              <svg viewBox="0 0 24 24" fill="none" className="size-4.5 md:size-5" aria-hidden="true">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-white md:text-xl leading-none">
                Chap<span className="text-[#4aa3ea]">Express</span>
              </span>
              <span className="text-[10px] font-medium text-white/60 tracking-wider uppercase leading-tight">
                Livraison rapide
              </span>
            </span>
          </Link>
        </div>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1.5 md:flex">
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
                <span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white ring-1 ring-white/30">
                  {user.nom.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[10rem] truncate">{user.nom}</span>
              </span>
            </NavLink>
          ) : (
            <Button asChild size="sm" className="ml-2 rounded-full bg-white px-4 font-semibold text-brand-navy shadow-xs hover:bg-white/90 transition-transform active:scale-95">
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
