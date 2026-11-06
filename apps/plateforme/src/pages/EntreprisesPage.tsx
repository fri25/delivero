import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEntreprises, type EntrepriseResume } from '@/api/plateforme';
import { formatPrixFcfa } from '@/lib/format';

function Chiffre({ libelle, valeur, detail }: { libelle: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-xs">
      <p className="text-xs font-semibold text-muted-foreground">{libelle}</p>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">{valeur}</p>
      {detail && <p className="text-[11px] text-muted-foreground">{detail}</p>}
    </div>
  );
}

function Statut({ entreprise }: { entreprise: EntrepriseResume }) {
  return entreprise.statut === 'actif' ? (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Active</span>
  ) : (
    <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">Suspendue</span>
  );
}

const nombre = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

/** Companies of the platform and their activity (étape 9). */
export function EntreprisesPage() {
  const { data: entreprises, isPending, isError } = useEntreprises();
  const total = (cle: 'commandes30j' | 'montant30j' | 'livreursDisponibles' | 'clients') =>
    (entreprises ?? []).reduce((somme, e) => somme + e.statistiques[cle], 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Entreprises</h1>
          <p className="text-sm text-muted-foreground mt-1">Les entreprises de livraison hébergées par RapidLiv.</p>
        </div>
        <Button asChild className="h-10 gap-2 rounded-2xl font-bold">
          <Link to="/entreprises/nouvelle">
            <Plus className="size-4" aria-hidden="true" />
            Nouvelle entreprise
          </Link>
        </Button>
      </div>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      ) : isError || !entreprises ? (
        <p className="rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Impossible de charger les entreprises.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Chiffre libelle="Entreprises actives" valeur={nombre(entreprises.filter((e) => e.statut === 'actif').length)} detail={`${entreprises.length} au total`} />
            <Chiffre libelle="Commandes (30 jours)" valeur={nombre(total('commandes30j'))} />
            <Chiffre libelle="Montant commandé (30 jours)" valeur={formatPrixFcfa(total('montant30j'))} detail="Tous statuts, annulées comprises" />
            <Chiffre libelle="Livreurs disponibles" valeur={nombre(total('livreursDisponibles'))} detail={`${nombre(total('clients'))} clients inscrits`} />
          </div>

          <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-xs">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Entreprise</th>
                  <th className="px-4 py-3 font-semibold">Domaine</th>
                  <th className="px-4 py-3 font-semibold">Offre</th>
                  <th className="px-4 py-3 text-right font-semibold">Commandes 30 j</th>
                  <th className="px-4 py-3 text-right font-semibold">Montant 30 j</th>
                  <th className="px-4 py-3 text-right font-semibold">Livreurs</th>
                  <th className="px-4 py-3 text-right font-semibold">Clients</th>
                </tr>
              </thead>
              <tbody>
                {entreprises.map((e) => {
                  const principal = e.domaines.find((d) => d.principal) ?? e.domaines[0];
                  return (
                    <tr key={e.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <Link to={`/entreprises/${e.id}`} className="font-semibold text-foreground hover:text-primary">
                          {e.nomCommercial ?? e.nom}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{e.slug}</span>
                          {e.ville && <span>· {e.ville}</span>}
                          <Statut entreprise={e} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {principal ? (
                          <span className="font-mono">
                            {principal.domaine}
                            {!principal.verifie && <span className="ml-1 font-sans text-amber-700">(non vérifié)</span>}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">{e.abonnement ? `${e.abonnement.plan} · ${e.abonnement.statut}` : '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{nombre(e.statistiques.commandes30j)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatPrixFcfa(e.statistiques.montant30j)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {e.statistiques.livreursDisponibles} / {e.statistiques.livreurs}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{nombre(e.statistiques.clients)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground">Livreurs : disponibles / inscrits. Montant : total des commandes passées sur 30 jours, tous statuts.</p>
        </>
      )}
    </div>
  );
}
