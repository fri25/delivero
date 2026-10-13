import { CircleHelp, History, LogOut, MapPin, MessageCircle, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LigneCompte } from '@/components/compte/LigneCompte';
import { Button } from '@/components/ui/button';
import { desactiverPush } from '@/lib/push';
import { WHATSAPP_SUPPORT } from '@/lib/support';
import { useAuthStore } from '@/stores/auth-store';

/** Account tab: everything that is not ordering, gathered in one place. */
export function ComptePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {user ? (
        <section className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <UserRound className="size-7" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading truncate text-xl font-semibold">{user.nom}</h1>
            <p className="text-sm text-muted-foreground">{user.telephone}</p>
          </div>
        </section>
      ) : (
        <section className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <div>
            <h1 className="font-heading text-xl font-semibold">Votre compte</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Connectez-vous avec votre numéro de téléphone pour retrouver vos adresses et suivre toutes vos
              commandes. Pas de mot de passe à retenir : vous recevez un code par WhatsApp ou SMS.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild size="lg">
              <Link to="/connexion">Se connecter</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/inscription">Créer un compte</Link>
            </Button>
          </div>
        </section>
      )}

      <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        {user && (
          <>
            <LigneCompte to="/commandes" icon={History} label="Mes commandes" detail="Suivi et historique" />
            <LigneCompte to="/adresses" icon={MapPin} label="Mes adresses" detail="Domicile, bureau, points de repère" />
          </>
        )}
        <LigneCompte to="/aide" icon={CircleHelp} label="Aide" detail="Questions fréquentes" />
        <LigneCompte href={WHATSAPP_SUPPORT} icon={MessageCircle} label="Écrire au support" detail="WhatsApp · 01 57 86 69 59" />
      </ul>

      {user && (
        <Button
          variant="outline"
          size="lg"
          className="w-full text-destructive hover:text-destructive"
          onClick={() => {
            if (token) void desactiverPush(token);
            logout();
            navigate('/');
          }}
        >
          <LogOut /> Se déconnecter
        </Button>
      )}
    </div>
  );
}
