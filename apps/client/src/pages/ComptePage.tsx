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
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-[#0c2f66] to-brand-blue p-6 text-white shadow-lg">
          <div className="absolute -right-8 -top-8 size-36 rounded-full bg-brand-light/15 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-inner">
              {user.nom ? (
                <span className="font-heading text-xl font-bold">{user.nom.charAt(0).toUpperCase()}</span>
              ) : (
                <UserRound className="size-7" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading truncate text-xl font-bold text-white">{user.nom}</h1>
              <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">{user.telephone}</p>
              {user.email && <p className="text-xs text-white/60 truncate mt-0.5">{user.email}</p>}
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4 rounded-3xl bg-card p-6 border border-border/70 shadow-xs">
          <div>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary mb-2">
              👋 Bienvenue sur ChapExpress
            </span>
            <h1 className="font-heading text-xl font-bold text-foreground">Votre compte</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Connectez-vous avec votre numéro pour retrouver vos adresses et suivre vos commandes à Natitingou.
              Pas de mot de passe à retenir : un code sécurisé par SMS ou WhatsApp suffit.
            </p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
            <Button asChild size="lg" className="rounded-xl font-semibold shadow-md shadow-primary/20">
              <Link to="/connexion">Se connecter</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl font-semibold">
              <Link to="/inscription">Créer un compte</Link>
            </Button>
          </div>
        </section>
      )}

      <ul className="divide-y divide-border/60 overflow-hidden rounded-3xl bg-card border border-border/70 shadow-xs">
        {user && (
          <>
            <LigneCompte to="/commandes" icon={History} label="Mes commandes" detail="Suivi et historique complet" />
            <LigneCompte to="/adresses" icon={MapPin} label="Mes adresses" detail="Domicile, bureau, points de repère" />
          </>
        )}
        <LigneCompte to="/aide" icon={CircleHelp} label="Aide & FAQ" detail="Questions fréquentes" />
        <LigneCompte href={WHATSAPP_SUPPORT} icon={MessageCircle} label="Écrire au support" detail="WhatsApp · 01 57 86 69 59" />
      </ul>

      {user && (
        <Button
          variant="outline"
          size="lg"
          className="w-full rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold shadow-2xs"
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
