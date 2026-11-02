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
    <div className="mx-auto max-w-md py-6 sm:py-12">
      <div className="carte space-y-6 p-6 sm:p-8">
        <div>
          <p className="font-heading text-2xl leading-none font-extrabold tracking-[-0.03em]">
            Chap<span className="text-primary">Express</span>
          </p>
          <h1 className="titre-page mt-6">Espace partenaire</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Connectez-vous avec le compte de votre restaurant pour gérer vos commandes.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate(
              { telephone, motDePasse },
              {
                onSuccess: (data) => {
                  if (data.user.role !== 'restaurant') {
                    toast.error("Ce compte n'est pas un compte restaurant.");
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
            <Label htmlFor="telephone" className="text-xs font-semibold">Numéro de téléphone</Label>
            <Input
              id="telephone"
              type="tel"
              value={telephone}
              onChange={(event) => setTelephone(event.target.value)}
              placeholder="+229 01 00 00 00"
              className="rounded-xl tabular-nums"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motDePasse" className="text-xs font-semibold">Mot de passe</Label>
            <Input
              id="motDePasse"
              type="password"
              value={motDePasse}
              onChange={(event) => setMotDePasse(event.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl text-base font-bold"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        <div className="rounded-xl bg-muted p-3 text-center text-sm text-muted-foreground">
          Pas encore de compte partenaire ? Contactez ChapExpress pour l'ouverture et la validation de votre fiche établissement.
        </div>
      </div>
    </div>
  );
}
