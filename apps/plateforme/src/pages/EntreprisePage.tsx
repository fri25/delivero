import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Globe, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  actions,
  LIBELLES_FONCTIONNALITES,
  useActionEntreprise,
  useEntreprise,
  useOffres,
  type EntrepriseDetail,
  type StatutAbonnement,
} from '@/api/plateforme';
import { formatDateHeure, formatPrixFcfa } from '@/lib/format';

const erreur = (error: Error) => toast.error(error.message);

function Bloc({ titre, description, children }: { titre: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
      <div>
        <h2 className="font-heading text-base font-bold text-foreground">{titre}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Statut({ entreprise }: { entreprise: EntrepriseDetail }) {
  const changer = useActionEntreprise(entreprise.id, actions.statut(entreprise.id));
  const actif = entreprise.statut === 'actif';
  return (
    <Bloc
      titre="Statut"
      description="Une entreprise suspendue refuse toutes les requêtes : connexion, commandes, applications. Ses données restent intactes."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={actif ? 'font-semibold text-emerald-700' : 'font-semibold text-destructive'}>{actif ? 'Active' : 'Suspendue'}</p>
        <Button
          variant={actif ? 'destructive' : 'default'}
          disabled={changer.isPending}
          className="rounded-xl"
          onClick={() => {
            if (actif && !window.confirm(`Suspendre ${entreprise.nom} ? Ses clients, livreurs et partenaires perdent l’accès immédiatement.`)) return;
            changer.mutate(actif ? 'suspendu' : 'actif', {
              onSuccess: () => toast.success(actif ? 'Entreprise suspendue.' : 'Entreprise réactivée.'),
              onError: erreur,
            });
          }}
        >
          {actif ? 'Suspendre' : 'Réactiver'}
        </Button>
      </div>
    </Bloc>
  );
}

function Fonctionnalites({ entreprise }: { entreprise: EntrepriseDetail }) {
  const enregistrer = useActionEntreprise(entreprise.id, actions.fonctionnalites(entreprise.id));
  const [ouvertes, setOuvertes] = useState(() => new Set(entreprise.fonctionnalites.filter((f) => f.ouverte).map((f) => f.code)));
  const change = entreprise.fonctionnalites.some((f) => f.ouverte !== ouvertes.has(f.code));

  return (
    <Bloc
      titre="Fonctionnalités"
      description="Ce que l’entreprise ouvre à ses clients, dans la limite de ce que la plateforme active (variables SERVICES_ACTIFS, MODES_PAIEMENT_ACTIFS)."
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {entreprise.fonctionnalites.map(({ code }) => (
          <li key={code}>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 px-3 py-2.5 text-sm hover:bg-muted/40">
              <input
                type="checkbox"
                className="size-4 accent-[var(--primary)]"
                checked={ouvertes.has(code)}
                onChange={(e) => {
                  const suivantes = new Set(ouvertes);
                  if (e.target.checked) suivantes.add(code);
                  else suivantes.delete(code);
                  setOuvertes(suivantes);
                }}
              />
              {LIBELLES_FONCTIONNALITES[code] ?? code}
            </label>
          </li>
        ))}
      </ul>
      <Button
        disabled={!change || enregistrer.isPending}
        className="rounded-xl"
        onClick={() => enregistrer.mutate([...ouvertes], { onSuccess: () => toast.success('Fonctionnalités enregistrées.'), onError: erreur })}
      >
        Enregistrer
      </Button>
    </Bloc>
  );
}

function Abonnement({ entreprise }: { entreprise: EntrepriseDetail }) {
  const { data: offres } = useOffres();
  const enregistrer = useActionEntreprise(entreprise.id, actions.abonnement(entreprise.id));
  const [planCode, setPlanCode] = useState(entreprise.abonnement?.planCode ?? 'pilote');
  const [statut, setStatut] = useState<StatutAbonnement>(entreprise.abonnement?.statut ?? 'essai');
  const [finAt, setFinAt] = useState(entreprise.abonnement?.finAt?.slice(0, 10) ?? '');

  return (
    <Bloc titre="Offre" description="Suivi manuel : aucune facturation dans l’application.">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ab-plan" className="text-xs font-semibold">Offre</Label>
          <select id="ab-plan" value={planCode} onChange={(e) => setPlanCode(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm">
            {(offres ?? []).map((o) => (
              <option key={o.code} value={o.code}>{o.nom}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ab-statut" className="text-xs font-semibold">Statut</Label>
          <select id="ab-statut" value={statut} onChange={(e) => setStatut(e.target.value as StatutAbonnement)} className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm">
            <option value="essai">Essai</option>
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ab-fin" className="text-xs font-semibold">Fin (facultatif)</Label>
          <Input id="ab-fin" type="date" className="rounded-xl" value={finAt} onChange={(e) => setFinAt(e.target.value)} />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">Le statut de l’offre est informatif : seul le statut de l’entreprise coupe l’accès.</p>
      <Button
        disabled={enregistrer.isPending}
        className="rounded-xl"
        onClick={() =>
          enregistrer.mutate(
            { planCode, statut, finAt: finAt ? new Date(finAt).toISOString() : null },
            { onSuccess: () => toast.success('Offre enregistrée.'), onError: erreur },
          )
        }
      >
        Enregistrer
      </Button>
    </Bloc>
  );
}

function Domaines({ entreprise }: { entreprise: EntrepriseDetail }) {
  const ajouter = useActionEntreprise(entreprise.id, actions.ajouterDomaine(entreprise.id));
  const retirer = useActionEntreprise(entreprise.id, actions.retirerDomaine(entreprise.id));
  const verifier = useActionEntreprise(entreprise.id, actions.verifierDomaine(entreprise.id));
  const [domaine, setDomaine] = useState('');
  const [principal, setPrincipal] = useState(entreprise.domaines.length === 0);

  return (
    <Bloc
      titre="Domaines"
      description="Les applications ouvertes sur ces domaines servent cette entreprise. Un domaine vérifié sert aussi aux liens envoyés (paiement, suivi)."
    >
      {entreprise.domaines.length > 0 && (
        <ul className="space-y-2">
          {entreprise.domaines.map((d) => (
            <li key={d.id} className="space-y-2 rounded-2xl border border-border/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-mono text-sm">
                  <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
                  {d.domaine}
                  {d.principal && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-sans text-[11px] font-bold text-primary">Principal</span>}
                  {d.verifieAt ? (
                    <span className="flex items-center gap-1 font-sans text-xs text-emerald-700">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" /> vérifié le {formatDateHeure(d.verifieAt)}
                    </span>
                  ) : (
                    <span className="font-sans text-xs text-amber-700">non vérifié</span>
                  )}
                </p>
                <div className="flex gap-2">
                  {!d.verifieAt && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={verifier.isPending}
                      onClick={() => verifier.mutate(d.id, { onSuccess: () => toast.success('Domaine vérifié.'), onError: erreur })}
                    >
                      Vérifier
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-destructive"
                    aria-label={`Retirer ${d.domaine}`}
                    disabled={retirer.isPending}
                    onClick={() =>
                      window.confirm(`Retirer ${d.domaine} ? Les applications ouvertes sur ce domaine ne serviront plus cette entreprise.`) &&
                      retirer.mutate(d.id, { onSuccess: () => toast.success('Domaine retiré.'), onError: erreur })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {!d.verifieAt && (
                <p className="rounded-xl bg-muted/50 p-2 text-xs text-muted-foreground">
                  Enregistrement TXT à créer : <span className="font-mono text-foreground">{d.verification.nom}</span> ={' '}
                  <span className="font-mono text-foreground break-all">{d.verification.valeur}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          ajouter.mutate(
            { domaine: domaine.trim().toLowerCase(), principal },
            {
              onSuccess: () => {
                setDomaine('');
                toast.success('Domaine ajouté.');
              },
              onError: erreur,
            },
          );
        }}
      >
        <div className="min-w-64 flex-1 space-y-1.5">
          <Label htmlFor="dom-nom" className="text-xs font-semibold">Ajouter un domaine</Label>
          <Input id="dom-nom" className="rounded-xl font-mono" placeholder="livraison.exemple.bj" value={domaine} onChange={(e) => setDomaine(e.target.value)} required />
        </div>
        <label className="flex h-9 items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={principal} onChange={(e) => setPrincipal(e.target.checked)} />
          Principal
        </label>
        <Button type="submit" variant="outline" disabled={ajouter.isPending} className="rounded-xl">
          Ajouter
        </Button>
      </form>
    </Bloc>
  );
}

/** One company seen from the platform (étape 9). */
export function EntreprisePage() {
  const { id = '' } = useParams();
  const { data: entreprise, isPending, isError } = useEntreprise(id);

  if (isPending) return <Skeleton className="h-96 w-full rounded-3xl" />;
  if (isError || !entreprise) {
    return <p className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Entreprise introuvable.</p>;
  }
  const s = entreprise.statistiques;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Entreprises
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{entreprise.parametres?.nomCommercial ?? entreprise.nom}</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono">{entreprise.slug}</span> · {entreprise.nom}
          {entreprise.parametres && ` · ${entreprise.parametres.ville} · commission Repas ${entreprise.parametres.tauxCommission} %`} · créée le{' '}
          {formatDateHeure(entreprise.createdAt)}
        </p>
        <p className="text-sm text-foreground">
          {s.commandes} commandes ({s.commandes30j} sur 30 jours, {formatPrixFcfa(s.montant30j)}) · {s.partenaires} partenaires · {s.livreurs} livreurs · {s.clients} clients
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Statut entreprise={entreprise} />
          <Fonctionnalites key={`f-${entreprise.id}`} entreprise={entreprise} />
          <Abonnement key={`a-${entreprise.id}`} entreprise={entreprise} />
        </div>
        <div className="space-y-4">
          <Domaines entreprise={entreprise} />
          <Bloc titre="Administrateurs" description="Comptes admin_entreprise. L’entreprise gère elle-même ses autres comptes (écran Utilisateurs).">
            <ul className="space-y-1.5 text-sm">
              {entreprise.administrateurs.map((a) => (
                <li key={`${a.telephone}`} className="flex justify-between gap-2">
                  <span className="font-semibold">{a.nom}</span>
                  <span className="font-mono text-muted-foreground">
                    {a.telephone}
                    {a.statut !== 'actif' && <span className="ml-2 font-sans text-destructive">suspendu</span>}
                  </span>
                </li>
              ))}
              {entreprise.administrateurs.length === 0 && <li className="text-muted-foreground">Aucun administrateur.</li>}
            </ul>
          </Bloc>
        </div>
      </div>
    </div>
  );
}
