import { LogOut, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantite, 0));

  return (
    <header className="sticky top-0 z-20 bg-brand-navy text-white">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          ChapExpress
        </Link>

        <nav className="flex items-center gap-4">
          {user && (
            <Link to="/commandes" className="text-sm text-white/75 hover:text-white">
              Mes commandes
            </Link>
          )}

          <Link to="/panier" className="relative text-white/90 hover:text-white" aria-label="Panier">
            <ShoppingCart className="size-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 flex size-4.5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-brand-navy">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/75">{user.nom}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Déconnexion"
                className="text-white/90 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link to="/connexion">Connexion</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
