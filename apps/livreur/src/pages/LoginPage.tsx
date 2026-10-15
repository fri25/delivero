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
      <div className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-navy shadow-md ring-1 ring-white/20">
          <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-white stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
          🛵 ChapExpress Livreur
        </span>
        <h1 className="font-heading text-2xl font-bold text-foreground">Espace Livreur</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Connectez-vous pour accéder à vos courses.</p>
      </div>

      <div className="rounded-3xl bg-card border border-border/70 p-6 shadow-xs">
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
      </div>
    </div>
  );
}
