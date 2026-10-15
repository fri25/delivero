import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Phone, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/api/auth';
import { useAuthStore } from '@/stores/auth-store';

const ADMIN_ROLE_NAME = 'admin_dispatcher';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const loginMutation = useLogin();

  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  return (
    <div className="mx-auto max-w-md py-8 sm:py-16">
      <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        {/* Brand Emblem */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-navy via-brand-blue to-cyan-400 text-white shadow-md">
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary mb-1">
              ChapExpress Back-Office
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Portail Dispatch & Admin
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Accès réservé aux comptes administrateur et régulateurs de commandes.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate(
              { telephone, motDePasse },
              {
                onSuccess: (data) => {
                  if (data.user.role !== ADMIN_ROLE_NAME) {
                    toast.error("Ce compte n'a pas accès au back-office.");
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
            <Label htmlFor="telephone" className="text-xs font-semibold">
              Numéro de téléphone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="telephone"
                type="tel"
                value={telephone}
                onChange={(event) => setTelephone(event.target.value)}
                placeholder="+229 01 00 00 00"
                className="pl-10 rounded-xl font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motDePasse" className="text-xs font-semibold">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="motDePasse"
                type="password"
                value={motDePasse}
                onChange={(event) => setMotDePasse(event.target.value)}
                className="pl-10 rounded-xl text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm active:scale-98 transition-all gap-2"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Connexion sécurisée en cours...</span>
              </>
            ) : (
              <span>Se connecter au Back-Office</span>
            )}
          </Button>
        </form>

        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
          Accès restreint. Les opérations de régulation, affectations et fermetures de caisse sont enregistrées et auditées.
        </div>
      </div>
    </div>
  );
}
