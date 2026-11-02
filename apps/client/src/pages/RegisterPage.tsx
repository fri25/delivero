import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegister } from '@/api/auth';
import { useAuthStore } from '@/stores/auth-store';

export function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const registerMutation = useRegister();

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="titre-page">Créer un compte</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Un compte garde vos adresses et l’historique de vos commandes.
        </p>
      </div>

      <div className="carte p-5 sm:p-6">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            registerMutation.mutate(
              {
                nom,
                telephone,
                motDePasse,
                ...(email.trim() ? { email: email.trim() } : {}),
              },
              {
                onSuccess: (data) => {
                  login(data.accessToken, data.user);
                  navigate('/', { replace: true });
                },
                onError: (error) => toast.error(error.message),
              },
            );
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom complet</Label>
            <Input id="nom" value={nom} onChange={(event) => setNom(event.target.value)} className="rounded-xl" placeholder="Votre nom" required />
          </div>

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
            <Label htmlFor="email">
              E-mail <span className="text-xs font-normal text-muted-foreground">(facultatif)</span>
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="exemple@domaine.bj"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motDePasse">Mot de passe</Label>
            <Input
              id="motDePasse"
              type="password"
              minLength={8}
              value={motDePasse}
              onChange={(event) => setMotDePasse(event.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <Button type="submit" className="h-11 w-full text-[15px] font-bold" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs sm:text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="font-bold text-primary hover:underline">
          Connectez-vous
        </Link>
      </p>
    </div>
  );
}
