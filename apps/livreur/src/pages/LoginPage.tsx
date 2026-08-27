import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/api/auth';
import { useAuthStore } from '@/stores/auth-store';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const loginMutation = useLogin();

  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Espace livreur</h1>
        <p className="text-sm text-muted-foreground">Connectez-vous avec votre compte livreur.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          loginMutation.mutate(
            { telephone, motDePasse },
            {
              onSuccess: (data) => {
                if (data.user.role !== 'livreur') {
                  toast.error("Ce compte n'est pas un compte livreur.");
                  return;
                }
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
    </div>
  );
}
