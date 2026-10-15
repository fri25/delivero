import { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Receipt,
  Store,
  Bike,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useStatistiques } from '@/api/statistiques';
import { formatPrixFcfa } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ClassementStatistique, Periode, Statistiques, TypeService } from '@/api/types';

const PERIODES: { valeur: Periode; label: string; comparaison: string; precedent: string }[] = [
  { valeur: 'jour', label: 'Aujourd’hui', comparaison: 'par rapport à hier', precedent: 'hier' },
  {
    valeur: '7j',
    label: '7 derniers jours',
    comparaison: 'par rapport aux 7j précédents',
    precedent: 'sur les 7 jours précédents',
  },
  {
    valeur: '30j',
    label: '30 derniers jours',
    comparaison: 'par rapport aux 30j précédents',
    precedent: 'sur les 30 jours précédents',
  },
];

const SERVICE_LABELS: Record<TypeService, string> = {
  repas: 'Repas restaurants',
  colis: 'Colis express',
  emplettes: 'Courses emplettes',
  courses_express: 'Courses en ville',
};

const formatJour = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
const formatJourCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const jourLisible = (jour: string, format = formatJour) => format.format(new Date(`${jour}T12:00:00Z`));

function evolution(actuel: number, precedent: number): number | null {
  return precedent === 0 ? null : Math.round(((actuel - precedent) / precedent) * 100);
}

function Evolution({ actuel, precedent, comparaison }: { actuel: number; precedent: number; comparaison: string }) {
  const pourcentage = evolution(actuel, precedent);
  if (pourcentage === null) return <p className="text-xs text-white/70">Rien à comparer {comparaison}</p>;
  const Icone = pourcentage >= 0 ? ArrowUpRight : ArrowDownRight;
  const positif = pourcentage >= 0;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/80">
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold shadow-2xs',
          positif ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-400/30' : 'bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/30',
        )}
      >
        <Icone className="size-3.5" aria-hidden="true" />
        {positif ? '+' : ''}
        {pourcentage} %
      </span>
      <span>{comparaison}</span>
    </div>
  );
}

function Tuile({
  label,
  valeur,
  detail,
  icone: Icone,
}: {
  label: string;
  valeur: string;
  detail?: string;
  icone: typeof Activity;
}) {
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-card p-4 sm:p-5 border border-border/70 shadow-xs transition-all hover:shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icone className="size-4" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-3">
        <p className="font-heading text-2xl font-bold tracking-tight text-foreground">{valeur}</p>
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}

function formatDuree(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}

/** Orders per day, one hue; hover a column for its figure. */
function DemandesParJour({ parJour }: { parJour: Statistiques['parJour'] }) {
  const max = Math.max(...parJour.map((jour) => jour.demandes), 1);
  const tous = parJour.length <= 7;
  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 border border-border/70 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-base text-foreground">Demandes par jour</h2>
        <span className="text-xs text-muted-foreground">Volume de commandes</span>
      </div>
      <div className="flex h-44 items-end gap-1 sm:gap-2 pt-4 px-1" aria-hidden="true">
        {parJour.map((jour) => (
          <div key={jour.jour} className="group relative flex h-full flex-1 items-end justify-center">
            <div
              className={cn(
                'w-full max-w-10 rounded-t-lg bg-gradient-to-t from-brand-blue to-cyan-400 transition-all group-hover:brightness-110 shadow-2xs',
                jour.demandes === 0 && 'bg-muted opacity-40',
              )}
              style={{ height: jour.demandes === 0 ? 3 : `${Math.max((jour.demandes / max) * 100, 4)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 rounded-xl bg-brand-navy border border-white/10 px-3 py-2 text-xs whitespace-nowrap text-white shadow-xl group-hover:block">
              <p className="font-bold text-cyan-300">{jourLisible(jour.jour)}</p>
              <p className="text-white font-medium">
                {jour.demandes} demande{jour.demandes > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground font-medium" aria-hidden="true">
        {parJour.map((jour, index) => (
          <span key={jour.jour} className="flex flex-1 justify-center whitespace-nowrap">
            {tous || (parJour.length - 1 - index) % 7 === 0 ? jourLisible(jour.jour, tous ? formatJour : formatJourCourt) : ''}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Demandes par jour</caption>
        <tbody>
          {parJour.map((jour) => (
            <tr key={jour.jour}>
              <td>{jourLisible(jour.jour, formatJourCourt)}</td>
              <td>{jour.demandes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Classement({
  titre,
  lignes,
  unite,
  libelleMontant,
  icone: Icone,
}: {
  titre: string;
  lignes: ClassementStatistique[];
  unite: string;
  libelleMontant: string;
  icone: typeof Store;
}) {
  const max = Math.max(...lignes.map((ligne) => ligne.terminees), 1);
  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 border border-border/70 shadow-xs">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icone className="size-4" />
        </div>
        <h2 className="font-heading font-bold text-base text-foreground">{titre}</h2>
      </div>
      {lignes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucune activité terminée sur la période.</p>
      ) : (
        <ol className="space-y-3.5">
          {lignes.map((ligne, idx) => (
            <li key={ligne.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 truncate font-semibold text-foreground">
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground tabular-nums shrink-0">
                    {idx + 1}
                  </span>
                  <span className="truncate">{ligne.nom}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  <span className="font-mono font-bold text-foreground">{ligne.terminees}</span> {unite}
                  {ligne.terminees > 1 ? 's' : ''} · <span className="font-mono text-primary font-semibold">{formatPrixFcfa(ligne.montant)}</span> ({libelleMontant})
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-blue to-cyan-400 transition-all duration-500"
                  style={{ width: `${(ligne.terminees / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/**
 * F-ADM-14 — the dispatcher's home screen: activity of the period against
 * the one before, what is waiting for action, and who carries the load.
 */
export function TableauDeBordPage() {
  const [periode, setPeriode] = useState<Periode>('jour');
  const { data: stats, isPending, isError } = useStatistiques(periode);
  const { comparaison, precedent } = PERIODES.find((p) => p.valeur === periode)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Tableau de bord général</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Supervision globale des opérations ChapExpress</p>
        </div>
        <div role="radiogroup" aria-label="Période" className="flex rounded-full bg-muted/80 p-1 border border-border/60 self-start sm:self-auto">
          {PERIODES.map((option) => (
            <button
              key={option.valeur}
              type="button"
              role="radio"
              aria-checked={periode === option.valeur}
              onClick={() => setPeriode(option.valeur)}
              className={cn(
                'h-8.5 rounded-full px-3.5 text-xs font-semibold transition-all',
                periode === option.valeur
                  ? 'bg-card text-foreground shadow-2xs font-bold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
          <p className="font-heading font-semibold text-base">Impossible de charger les statistiques</p>
          <p className="mt-1 text-xs text-muted-foreground">Veuillez vérifier votre connexion au serveur API.</p>
        </div>
      ) : (
        <>
          {stats.aRembourser.nombre > 0 && (
            <Link
              to="/remboursements"
              className="flex items-center gap-3.5 rounded-3xl border border-destructive/30 bg-destructive/10 p-4 sm:p-5 text-sm text-destructive shadow-sm hover:bg-destructive/15 transition-colors group"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-destructive text-white shadow-xs shrink-0">
                <AlertTriangle className="size-5 animate-pulse" aria-hidden="true" />
              </div>
              <div>
                <span className="font-heading font-bold text-base block">
                  {stats.aRembourser.nombre} remboursement{stats.aRembourser.nombre > 1 ? 's' : ''} en attente
                </span>
                <span className="text-xs sm:text-sm text-destructive/85">
                  {formatPrixFcfa(stats.aRembourser.montant)} à restituer aux clients
                </span>
              </div>
              <span className="ml-auto font-bold text-xs sm:text-sm rounded-full bg-destructive text-white px-3 py-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                Traiter →
              </span>
            </Link>
          )}

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-blue/90 p-6 text-white shadow-md">
            <div className="relative z-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Volume d'affaires terminé
              </span>
              <p className="mt-1.5 font-heading text-4xl sm:text-5xl font-bold tracking-tight">
                {formatPrixFcfa(stats.actuel.montantTermine)}
              </p>
              <div className="mt-3">
                <Evolution
                  actuel={stats.actuel.montantTermine}
                  precedent={stats.precedent.montantTermine}
                  comparaison={comparaison}
                />
              </div>
            </div>
            <div className="pointer-events-none absolute -right-6 -bottom-10 size-48 rounded-full bg-cyan-400/10 blur-2xl" />
          </section>

          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
            <Tuile
              label="Demandes"
              valeur={String(stats.actuel.demandes)}
              detail={`${stats.precedent.demandes} ${precedent}`}
              icone={Activity}
            />
            <Tuile
              label="Terminées"
              valeur={String(stats.actuel.terminees)}
              detail={`${stats.actuel.enCours} en cours / litige`}
              icone={CheckCircle2}
            />
            <Tuile
              label="Panier moyen"
              valeur={stats.actuel.panierMoyen === null ? '—' : formatPrixFcfa(stats.actuel.panierMoyen)}
              detail="Total / commande"
              icone={Receipt}
            />
            <Tuile
              label="Taux d’annulation"
              valeur={stats.actuel.tauxAnnulation === null ? '—' : `${stats.actuel.tauxAnnulation} %`}
              detail={`${stats.actuel.annulees} annulée${stats.actuel.annulees > 1 ? 's' : ''}`}
              icone={AlertOctagon}
            />
            <Tuile
              label="Délai moyen"
              valeur={formatDuree(stats.actuel.delaiMoyenMinutes)}
              detail="Commande à livraison"
              icone={Clock}
            />
          </div>

          {stats.parService.length > 0 && (
            <section className="space-y-3.5">
              <h2 className="font-heading font-bold text-lg text-foreground">Répartition par service</h2>
              <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-xs">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 bg-muted/40 text-left text-xs text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3 text-right">Demandes</th>
                      <th className="px-4 py-3 text-right">Terminées</th>
                      <th className="px-4 py-3 text-right">Annulées</th>
                      <th className="px-4 py-3 text-right">Montant terminé</th>
                      <th className="px-4 py-3 text-right">Délai moyen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {stats.parService.map((service) => (
                      <tr key={service.typeService} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{SERVICE_LABELS[service.typeService]}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">{service.demandes}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-600 font-semibold">{service.terminees}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-destructive font-semibold">{service.annulees}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-foreground">{formatPrixFcfa(service.montantTermine)}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">{formatDuree(service.delaiMoyenMinutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="grid gap-4 xl:grid-cols-3">
            {stats.parJour.length > 1 && <DemandesParJour parJour={stats.parJour} />}
            <Classement titre="Top Restaurants" lignes={stats.restaurants} unite="commande" libelleMontant="plats" icone={Store} />
            <Classement titre="Top Livreurs" lignes={stats.livreurs} unite="course" libelleMontant="montant" icone={Bike} />
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-xs text-muted-foreground">
            Les commandes Mobile Money jamais payées ne sont pas comptées. « Montant » = total payé par les clients
            (plats, livraison et commission compris). Le délai moyen se base sur la dernière mise à jour de la commande
            livrée : estimation calculée pour la zone de Natitingou.
          </div>
        </>
      )}
    </div>
  );
}
