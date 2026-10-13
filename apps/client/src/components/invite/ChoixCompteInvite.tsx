import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/** Signed-out visitor about to order: sign in, or go on without an account. */
export function ChoixCompteInvite({ onSansCompte }: { onSansCompte: () => void }) {
  const location = useLocation();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Avec un compte, vos adresses sont mémorisées et vous retrouvez toutes vos commandes. Sans compte, vous
        recevez simplement le lien de suivi par WhatsApp ou SMS.
      </p>
      {/* No flex-1 here: in a column flex container it would zero the
          buttons' height (flex-basis 0 overrides h-11). */}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild>
          {/* Back here after sign-in (LoginPage reads state.from). */}
          <Link to="/connexion" state={{ from: location }}>
            Se connecter
          </Link>
        </Button>
        <Button type="button" variant="outline" onClick={onSansCompte}>
          Continuer sans compte
        </Button>
      </div>
    </div>
  );
}
