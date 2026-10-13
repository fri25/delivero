import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { OtpLoginForm } from '@/components/auth/OtpLoginForm';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const loginMutation = useLogin();

  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  // F-CLI-01 : le code reçu par WhatsApp/SMS est proposé d'abord (pas de mot
  // de passe à retenir) ; le mot de passe reste possible.
  const [mode, setMode] = useState<'code' | 'mot_de_passe'>('code');

  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Connexion</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entrez votre numéro : vous recevez un code par WhatsApp ou SMS. Pas de mot de passe à retenir.
        </p>
      </div>

      {mode === 'code' ? (
        <OtpLoginForm
          onConnecte={(data) => {
            login(data.accessToken, data.user);
            navigate(redirectTo, { replace: true });
          }}
        />
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate(
              { telephone, motDePasse },
              {
                onSuccess: (data) => {
                  login(data.accessToken, data.user);
                  navigate(redirectTo, { replace: true });
                },
                onError: (error) => toast.error(error.message),
              },
            );
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={telephone}
              onChange={(event) => setTelephone(event.target.value)}
              placeholder="+22900000000"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motDePasse">Mot de passe</Label>
            <Input
              id="motDePasse"
              type="password"
              value={motDePasse}
              onChange={(event) => setMotDePasse(event.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setMode(mode === 'code' ? 'mot_de_passe' : 'code')}
      >
        {mode === 'code' ? 'Se connecter avec un mot de passe' : 'Recevoir un code par WhatsApp/SMS'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="text-brand-blue hover:underline">
          Inscrivez-vous
        </Link>
      </p>
    </div>
  );
}
