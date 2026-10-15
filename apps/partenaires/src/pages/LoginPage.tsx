import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
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
      <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-navy via-brand-blue to-cyan-400 text-white shadow-md">
            <Store className="size-7" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Espace Partenaire</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Connectez-vous avec le compte de votre restaurant pour gérer vos commandes.
            </p>
          </div>
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
              className="rounded-xl font-mono"
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
            className="w-full h-11 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm active:scale-98 transition-all"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
          Pas encore de compte partenaire ? Contactez ChapExpress pour l'ouverture et la validation de votre fiche établissement.
        </div>
      </div>
    </div>
  );
}
