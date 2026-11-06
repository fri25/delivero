import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { useConnexion } from '@/api/plateforme';
import { useAuthStore } from '@/stores/auth-store';

export function ConnexionPage() {
  const token = useAuthStore((state) => state.token);
  const connecter = useAuthStore((state) => state.connecter);
  const connexion = useConnexion();
  const navigate = useNavigate();
  const location = useLocation();
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const retour = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  if (token) return <Navigate to={retour} replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        className="w-full max-w-sm space-y-5 rounded-3xl bg-card p-7 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          connexion.mutate(
            { telephone: telephone.trim(), motDePasse },
            {
              onSuccess: ({ accessToken, user }) => {
                connecter(accessToken, user);
                navigate(retour, { replace: true });
              },
              onError: (error) => toast.error(error.message),
            },
          );
        }}
      >
        <div className="space-y-1 text-center">
          <p className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Rapid<span className="text-primary">Liv</span>
          </p>
          <p className="text-sm text-muted-foreground">Espace de l’équipe plateforme</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telephone" className="text-xs font-semibold">Téléphone</Label>
          <Input id="telephone" type="tel" className="rounded-xl" value={telephone} onChange={(e) => setTelephone(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="motDePasse" className="text-xs font-semibold">Mot de passe</Label>
          <Input id="motDePasse" type="password" className="rounded-xl" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
        </div>
        <Button type="submit" disabled={connexion.isPending} className="h-11 w-full rounded-2xl font-bold">
          {connexion.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Se connecter'}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">Accès réservé. Chaque action est inscrite au journal de la plateforme.</p>
      </form>
      <Toaster position="top-center" />
    </div>
  );
}
