import { useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
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
    label: '7 jours',
    comparaison: 'par rapport aux 7 jours précédents',
    precedent: 'sur les 7 jours précédents',
  },
  {
    valeur: '30j',
    label: '30 jours',
    comparaison: 'par rapport aux 30 jours précédents',
    precedent: 'sur les 30 jours précédents',
  },
];

const SERVICE_LABELS: Record<TypeService, string> = {
  repas: 'Repas',
  colis: 'Colis',
  emplettes: 'Emplettes',
  courses_express: 'Course en ville',
};

const formatJour = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
const formatJourCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const jourLisible = (jour: string, format = formatJour) => format.format(new Date(`${jour}T12:00:00Z`));

function evolution(actuel: number, precedent: number): number | null {
  return precedent === 0 ? null : Math.round(((actuel - precedent) / precedent) * 100);
}

function Evolution({ actuel, precedent, comparaison }: { actuel: number; precedent: number; comparaison: string }) {
  const pourcentage = evolution(actuel, precedent);
  if (pourcentage === null) return <p className="text-sm text-white/75">Rien à comparer {comparaison}</p>;
  const Icone = pourcentage >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm text-white/75">
      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white">
        <Icone className="size-4" aria-hidden="true" />
        {pourcentage >= 0 ? '+' : ''}
        {pourcentage} %
      </span>
      {comparaison}
    </p>
  );
}

function Tuile({ label, valeur, detail }: { label: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold">{valeur}</p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
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
    <section className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="font-heading font-semibold">Demandes par jour</h2>
      <div className="flex h-40 items-end gap-0.5" aria-hidden="true">
        {parJour.map((jour) => (
          <div key={jour.jour} className="group relative flex h-full flex-1 items-end justify-center">
            <div
              className={cn('w-full max-w-10 rounded-t-[4px] bg-primary group-hover:opacity-80', jour.demandes === 0 && 'bg-muted')}
              style={{ height: jour.demandes === 0 ? 2 : `${Math.max((jour.demandes / max) * 100, 3)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-xs whitespace-nowrap text-background shadow-lg group-hover:block">
              <p className="font-semibold">{jourLisible(jour.jour)}</p>
              <p>
                {jour.demandes} demande{jour.demandes > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 border-t border-border pt-1.5 text-[11px] text-muted-foreground" aria-hidden="true">
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
}: {
  titre: string;
  lignes: ClassementStatistique[];
  unite: string;
  libelleMontant: string;
}) {
  const max = Math.max(...lignes.map((ligne) => ligne.terminees), 1);
  return (
    <section className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="font-heading font-semibold">{titre}</h2>
      {lignes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Rien de terminé sur la période.</p>
      ) : (
        <ol className="space-y-3">
          {lignes.map((ligne) => (
            <li key={ligne.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{ligne.nom}</span>
                <span className="shrink-0 text-muted-foreground">
                  <span className="font-semibold text-foreground">{ligne.terminees}</span> {unite}
                  {ligne.terminees > 1 ? 's' : ''} · {libelleMontant} {formatPrixFcfa(ligne.montant)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(ligne.terminees / max) * 100}%` }} />
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-semibold">Tableau de bord</h1>
        <div role="radiogroup" aria-label="Période" className="flex rounded-full bg-secondary p-1">
          {PERIODES.map((option) => (
            <button
              key={option.valeur}
              type="button"
              role="radio"
              aria-checked={periode === option.valeur}
              onClick={() => setPeriode(option.valeur)}
              className={cn(
                'h-9 rounded-full px-4 text-sm font-medium transition-colors',
                periode === option.valeur ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Impossible de charger les statistiques.</p>
      ) : (
        <>
          {stats.aRembourser.nombre > 0 && (
            <Link
              to="/remboursements"
              className="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive hover:bg-destructive/15"
            >
              <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-semibold">
                  {stats.aRembourser.nombre} remboursement{stats.aRembourser.nombre > 1 ? 's' : ''} en attente
                </span>{' '}
                · {formatPrixFcfa(stats.aRembourser.montant)} à renvoyer aux clients
              </span>
              <span className="ml-auto font-medium">Traiter →</span>
            </Link>
          )}

          <section className="rounded-2xl bg-brand-navy p-5 text-white">
            <p className="text-sm text-white/75">Montant des commandes terminées</p>
            <p className="mt-1 font-heading text-5xl font-semibold tracking-tight">
              {formatPrixFcfa(stats.actuel.montantTermine)}
            </p>
            <div className="mt-2">
              <Evolution
                actuel={stats.actuel.montantTermine}
                precedent={stats.precedent.montantTermine}
                comparaison={comparaison}
              />
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Tuile label="Demandes" valeur={String(stats.actuel.demandes)} detail={`${stats.precedent.demandes} ${precedent}`} />
            <Tuile
              label="Terminées"
              valeur={String(stats.actuel.terminees)}
              detail={`${stats.actuel.enCours} en cours ou en litige`}
            />
            <Tuile
              label="Panier moyen"
              valeur={stats.actuel.panierMoyen === null ? '—' : formatPrixFcfa(stats.actuel.panierMoyen)}
            />
            <Tuile
              label="Taux d’annulation"
              valeur={stats.actuel.tauxAnnulation === null ? '—' : `${stats.actuel.tauxAnnulation} %`}
              detail={`${stats.actuel.annulees} annulée${stats.actuel.annulees > 1 ? 's' : ''} ou refusée${stats.actuel.annulees > 1 ? 's' : ''}`}
            />
            <Tuile
              label="Délai moyen"
              valeur={formatDuree(stats.actuel.delaiMoyenMinutes)}
              detail="De la commande à la livraison, approximatif"
            />
          </div>

          {stats.parService.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-heading font-semibold">Par service</h2>
              <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Service</th>
                      <th className="px-3 py-2 text-right font-medium">Demandes</th>
                      <th className="px-3 py-2 text-right font-medium">Terminées</th>
                      <th className="px-3 py-2 text-right font-medium">Annulées</th>
                      <th className="px-3 py-2 text-right font-medium">Montant terminé</th>
                      <th className="px-3 py-2 text-right font-medium">Délai moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.parService.map((service) => (
                      <tr key={service.typeService} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{SERVICE_LABELS[service.typeService]}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{service.demandes}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{service.terminees}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{service.annulees}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatPrixFcfa(service.montantTermine)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatDuree(service.delaiMoyenMinutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="grid gap-4 xl:grid-cols-3">
            {stats.parJour.length > 1 && <DemandesParJour parJour={stats.parJour} />}
            <Classement titre="Restaurants" lignes={stats.restaurants} unite="commande" libelleMontant="plats" />
            <Classement titre="Livreurs" lignes={stats.livreurs} unite="course" libelleMontant="montant" />
          </div>

          <p className="text-xs text-muted-foreground">
            Les commandes Mobile Money jamais payées ne sont pas comptées. « Montant » = total payé par les clients
            (plats, livraison et commission compris). Le délai moyen se base sur la dernière mise à jour de la commande
            livrée : c’est une estimation.
          </p>
        </>
      )}
    </div>
  );
}
