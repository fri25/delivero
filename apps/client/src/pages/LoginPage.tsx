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
      <div className="text-center">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
          ⚡ ChapExpress Client
        </span>
        <h1 className="font-heading text-2xl font-bold text-foreground">Connexion</h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Entrez votre numéro : recevez un code rapide par WhatsApp ou SMS.
        </p>
      </div>

      <div className="rounded-3xl bg-card border border-border/70 p-6 shadow-xs space-y-5">
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
                className="rounded-xl"
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
                className="rounded-xl"
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full rounded-xl font-bold shadow-md shadow-primary/20" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        )}

        <div className="border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === 'code' ? 'mot_de_passe' : 'code')}
          >
            {mode === 'code' ? 'Se connecter plutôt avec un mot de passe' : 'Recevoir plutôt un code par WhatsApp/SMS'}
          </Button>
        </div>
      </div>

      <p className="text-center text-xs sm:text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="font-bold text-primary hover:underline">
          Inscrivez-vous
        </Link>
      </p>
    </div>
  );
}
