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
  const [motDePasse, setMotDePasse] = useState('');

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-xl font-semibold">Créer un compte</h1>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          registerMutation.mutate(
            { nom, telephone, motDePasse },
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
          <Label htmlFor="nom">Nom</Label>
          <Input id="nom" value={nom} onChange={(event) => setNom(event.target.value)} required />
        </div>

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
            minLength={8}
            value={motDePasse}
            onChange={(event) => setMotDePasse(event.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Création...' : 'Créer mon compte'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="text-brand-blue hover:underline">
          Connectez-vous
        </Link>
      </p>
    </div>
  );
}
