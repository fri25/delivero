import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/** Signed-out visitor about to order: sign in, or go on without an account. */
export function ChoixCompteInvite({ onSansCompte }: { onSansCompte: () => void }) {
  const location = useLocation();
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <p className="text-sm">
        Connectez-vous pour retrouver vos adresses et votre historique, ou commandez sans compte.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          {/* Back here after sign-in (LoginPage reads state.from). */}
          <Link to="/connexion" state={{ from: location }}>
            Se connecter
          </Link>
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={onSansCompte}>
          Commander sans compte
        </Button>
      </div>
    </div>
  );
}
