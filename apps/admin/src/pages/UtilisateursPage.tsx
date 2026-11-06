import { useState } from 'react';
import { Plus, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useInviterUtilisateur,
  useModifierUtilisateur,
  useUtilisateurs,
  type RoleAttribuable,
  type UtilisateurBackOffice,
} from '@/api/entreprise';
import { LIBELLES_ROLES } from '@/lib/permissions';
import { formatDateHeure } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';

const DESCRIPTION_ROLES: Record<RoleAttribuable, string> = {
  admin_entreprise: 'Tout, y compris réglages, comptes et journal.',
  gestionnaire: 'Commandes, livreurs, caisse et clients. Ni zones, restaurants, remboursements ni réglages.',
};

function ChoixRole({ id, valeur, onChange }: { id: string; valeur: RoleAttribuable; onChange: (r: RoleAttribuable) => void }) {
  return (
    <select
      id={id}
      value={valeur}
      onChange={(e) => onChange(e.target.value as RoleAttribuable)}
      className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm"
    >
      <option value="gestionnaire">Gestionnaire</option>
      <option value="admin_entreprise">Administrateur</option>
    </select>
  );
}

function FormulaireInvitation({ onTermine }: { onTermine: () => void }) {
  const inviter = useInviterUtilisateur();
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [role, setRole] = useState<RoleAttribuable>('gestionnaire');
  const [motDePasse, setMotDePasse] = useState('');

  return (
    <form
      className="space-y-4 rounded-3xl border border-primary/30 bg-card p-5 sm:p-6 shadow-md"
      onSubmit={(event) => {
        event.preventDefault();
        inviter.mutate(
          { nom: nom.trim(), telephone: telephone.trim(), role, motDePasse: motDePasse || undefined },
          {
            onSuccess: (compte) => {
              toast.success(`${compte.nom} ajouté comme ${LIBELLES_ROLES[compte.role] ?? compte.role}. Connexion : ${compte.telephone}.`, {
                duration: 10_000,
              });
              onTermine();
            },
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    >
      <div className="border-b border-border/60 pb-3">
        <h2 className="font-heading text-lg font-bold text-foreground">Ajouter un compte</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Une personne qui a déjà un compte (client, autre entreprise) le garde, avec son mot de passe actuel.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inv-nom" className="text-xs font-semibold">Nom *</Label>
          <Input id="inv-nom" className="rounded-xl" value={nom} onChange={(e) => setNom(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-tel" className="text-xs font-semibold">Téléphone *</Label>
          <Input id="inv-tel" className="rounded-xl" inputMode="tel" placeholder="01 57 86 69 59" value={telephone} onChange={(e) => setTelephone(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-role" className="text-xs font-semibold">Rôle *</Label>
          <ChoixRole id="inv-role" valeur={role} onChange={setRole} />
          <p className="text-[11px] text-muted-foreground">{DESCRIPTION_ROLES[role]}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-mdp" className="text-xs font-semibold">Mot de passe provisoire</Label>
          <Input id="inv-mdp" className="rounded-xl" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} minLength={8} />
          <p className="text-[11px] text-muted-foreground">Requis pour un nouveau numéro, 8 caractères minimum.</p>
        </div>
      </div>
      <div className="flex gap-2 border-t border-border/60 pt-3">
        <Button type="submit" disabled={inviter.isPending} className="h-11 rounded-2xl px-6 font-bold bg-primary text-white">
          {inviter.isPending ? 'Ajout…' : 'Ajouter le compte'}
        </Button>
        <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={onTermine}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function LigneCompte({ compte, estMoi }: { compte: UtilisateurBackOffice; estMoi: boolean }) {
  const modifier = useModifierUtilisateur();
  const changer = (dto: { role?: RoleAttribuable; statut?: 'actif' | 'suspendu' }, message: string) =>
    modifier.mutate({ id: compte.id, dto }, { onSuccess: () => toast.success(message), onError: (error) => toast.error(error.message) });
  const suspendu = compte.statut === 'suspendu';

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/70 bg-card p-4 shadow-xs">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading font-bold text-foreground">{compte.nom}</p>
          {estMoi && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">Vous</span>}
          {suspendu && (
            <span className="rounded-full border border-destructive/30 bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">Suspendu</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono text-foreground">{compte.telephone}</span> · ajouté le {formatDateHeure(compte.createdAt)}
        </p>
      </div>
      {estMoi ? (
        <span className="text-sm font-semibold text-foreground">{LIBELLES_ROLES[compte.role] ?? compte.role}</span>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <ChoixRole
              id={`role-${compte.id}`}
              valeur={compte.role as RoleAttribuable}
              onChange={(role) => changer({ role }, `${compte.nom} est maintenant ${LIBELLES_ROLES[role]}.`)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={modifier.isPending}
            className="h-9 rounded-xl"
            onClick={() =>
              suspendu
                ? changer({ statut: 'actif' }, `Accès de ${compte.nom} rétabli.`)
                : window.confirm(`Suspendre l’accès de ${compte.nom} ? Sa session est fermée immédiatement.`) &&
                  changer({ statut: 'suspendu' }, `Accès de ${compte.nom} suspendu.`)
            }
          >
            {suspendu ? 'Rétablir' : 'Suspendre'}
          </Button>
        </div>
      )}
    </li>
  );
}

/** Back-office accounts of the company and their roles (étape 8). */
export function UtilisateursPage() {
  const { data: comptes, isPending, isError } = useUtilisateurs();
  const moi = useAuthStore((state) => state.user?.id);
  const [invitation, setInvitation] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Comptes du back-office. Livreurs et restaurants se gèrent dans leurs écrans.</p>
        </div>
        {!invitation && (
          <Button onClick={() => setInvitation(true)} className="h-10 rounded-2xl gap-2 font-bold bg-primary text-white">
            <Plus className="size-4" aria-hidden="true" />
            Ajouter un compte
          </Button>
        )}
      </div>
      {invitation && <FormulaireInvitation onTermine={() => setInvitation(false)} />}
      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
        </div>
      ) : isError || !comptes ? (
        <p className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Impossible de charger les comptes.</p>
      ) : comptes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <UserCog className="mx-auto mb-2 size-6" aria-hidden="true" />
          Aucun compte du back-office.
        </div>
      ) : (
        <ul className="space-y-3">
          {comptes.map((compte) => (
            <LigneCompte key={compte.id} compte={compte} estMoi={compte.userId === moi} />
          ))}
        </ul>
      )}
    </div>
  );
}
