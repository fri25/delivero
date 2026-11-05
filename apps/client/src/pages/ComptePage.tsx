import { CircleHelp, History, LogOut, MapPin, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LigneCompte } from '@/components/compte/LigneCompte';
import { Button } from '@/components/ui/button';
import { desactiverPush } from '@/lib/push';
import { useAuthStore } from '@/stores/auth-store';
import { useEntreprise } from '@/lib/entreprise';
import { useLienSupport } from '@/lib/support';
import { numeroLocal } from '@delivero/config/entreprise';

/** Account tab: everything that is not ordering, gathered in one place. */
export function ComptePage() {
  const entreprise = useEntreprise();
  const lienSupport = useLienSupport();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {user ? (
        <header>
          <h1 className="titre-page truncate">{user.nom}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground tabular-nums">{user.telephone}</p>
          {user.email && <p className="truncate text-sm text-muted-foreground">{user.email}</p>}
        </header>
      ) : (
        <section className="space-y-4">
          <div>
            <h1 className="titre-page">Votre compte</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Connectez-vous avec votre numéro pour retrouver vos adresses et suivre vos commandes à {entreprise.ville}.
              Pas de mot de passe à retenir : un code par SMS ou WhatsApp suffit.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild className="h-11 text-[15px] font-bold">
              <Link to="/connexion">Se connecter</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 text-[15px] font-bold">
              <Link to="/inscription">Créer un compte</Link>
            </Button>
          </div>
        </section>
      )}

      <ul className="carte divide-y divide-border px-4">
        {user && (
          <>
            <LigneCompte to="/commandes" icon={History} label="Mes commandes" detail="Suivi et historique complet" />
            <LigneCompte to="/adresses" icon={MapPin} label="Mes adresses" detail="Domicile, bureau, points de repère" />
          </>
        )}
        <LigneCompte to="/aide" icon={CircleHelp} label="Aide & FAQ" detail="Questions fréquentes" />
        <LigneCompte href={lienSupport} icon={MessageCircle} label="Écrire au support" detail={`WhatsApp · ${numeroLocal(entreprise, entreprise.whatsappSupport)}`} />
      </ul>

      {user && (
        <Button
          variant="outline"
          className="h-11 w-full border-0 bg-card font-bold text-destructive shadow-(--shadow-carte) hover:bg-destructive/5 hover:text-destructive"
          onClick={() => {
            if (token) void desactiverPush(token);
            logout();
            navigate('/');
          }}
        >
          <LogOut className="size-4" /> Se déconnecter
        </Button>
      )}
    </div>
  );
}
