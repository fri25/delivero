import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Flame, PackageCheck, Receipt, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMesCommandes } from '@/api/commandes';
import { formatPrixFcfa } from '@/lib/format';
import { useMaintenant } from '@/lib/maintenant';
import { bilan, evolution, joursGlissants, JOURS_PAR_PERIODE, type Bilan, type Periode } from '@/lib/ventes';
import { cn } from '@/lib/utils';

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

const formatJourCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const formatJourSemaine = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
const jourLisible = (jour: string, format = formatJourCourt) => format.format(new Date(`${jour}T12:00:00Z`));

/** On the navy hero: white text, the arrow and sign carry the direction. */
function Evolution({
  actuel,
  precedent,
  comparaison,
  periodePrecedente,
}: {
  actuel: number;
  precedent: number;
  comparaison: string;
  periodePrecedente: string;
}) {
  const pourcentage = evolution(actuel, precedent);
  if (pourcentage === null) return <p className="text-xs text-white/70">Aucune vente {periodePrecedente} pour comparer</p>;
  const hausse = pourcentage >= 0;
  const Icone = hausse ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/80">
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold shadow-2xs',
          hausse ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-400/30' : 'bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/30',
        )}
      >
        <Icone className="size-3.5" aria-hidden="true" />
        {hausse ? '+' : ''}
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
  icone: typeof Receipt;
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
        <p className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{valeur}</p>
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}

/** Daily sales as columns, one hue; hover or focus a day for its figures. */
function VentesParJour({ parJour }: { parJour: Bilan['parJour'] }) {
  const max = Math.max(...parJour.map((jour) => jour.montant), 1);
  const etiquetteTous = parJour.length <= 7;
  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 border border-border/70 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-base text-foreground">Évolution des ventes par jour</h2>
        <span className="text-xs text-muted-foreground">En FCFA</span>
      </div>
      <div className="flex h-44 items-end gap-1 sm:gap-2 pt-4 px-1" aria-hidden="true">
        {parJour.map((jour) => (
          <div key={jour.jour} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={-1}>
            <div
              className={cn(
                'w-full max-w-10 rounded-t-lg bg-gradient-to-t from-brand-blue to-cyan-400 transition-all group-hover:brightness-110 shadow-2xs',
                jour.montant === 0 && 'bg-muted opacity-40',
              )}
              style={{ height: jour.montant === 0 ? 3 : `${Math.max((jour.montant / max) * 100, 4)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 rounded-xl bg-brand-navy border border-white/10 px-3 py-2 text-xs whitespace-nowrap text-white shadow-xl group-hover:block">
              <p className="font-bold text-cyan-300">{jourLisible(jour.jour, formatJourSemaine)}</p>
              <p className="font-mono font-semibold text-white">{formatPrixFcfa(jour.montant)}</p>
              <p className="text-[11px] text-white/70">
                {jour.commandes} commande{jour.commandes > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground font-medium" aria-hidden="true">
        {parJour.map((jour, index) => (
          <span key={jour.jour} className="flex flex-1 justify-center overflow-visible whitespace-nowrap">
            {etiquetteTous || (parJour.length - 1 - index) % 7 === 0
              ? jourLisible(jour.jour, etiquetteTous ? formatJourSemaine : formatJourCourt)
              : ''}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Ventes par jour</caption>
        <thead>
          <tr>
            <th>Jour</th>
            <th>Ventes</th>
            <th>Commandes</th>
          </tr>
        </thead>
        <tbody>
          {parJour.map((jour) => (
            <tr key={jour.jour}>
              <td>{jourLisible(jour.jour)}</td>
              <td>{formatPrixFcfa(jour.montant)}</td>
              <td>{jour.commandes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TopPlats({ plats }: { plats: Bilan['topPlats'] }) {
  const max = Math.max(...plats.map((plat) => plat.quantite), 1);
  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 border border-border/70 shadow-xs">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
          <Flame className="size-4" />
        </div>
        <h2 className="font-heading font-bold text-base text-foreground">Plats les plus vendus</h2>
      </div>
      {plats.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Aucun plat vendu sur cette période.</div>
      ) : (
        <ol className="space-y-3.5">
          {plats.map((plat, idx) => (
            <li key={plat.nom} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 truncate font-semibold text-foreground">
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground tabular-nums shrink-0">
                    {idx + 1}
                  </span>
                  <span className="truncate">{plat.nom}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  <span className="font-mono font-bold text-foreground">{plat.quantite}</span> vendu{plat.quantite > 1 ? 's' : ''} · <span className="font-mono font-semibold text-primary">{formatPrixFcfa(plat.montant)}</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-blue to-cyan-400 transition-all duration-500"
                  style={{ width: `${(plat.quantite / max) * 100}%` }}
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
 * Sales dashboard (F-RES-07): what the kitchen sold over the period, against
 * the period before. Amounts are the restaurant's dishes only.
 */
export function VentesPage() {
  const { data: commandes, isPending, isError } = useMesCommandes();
  const maintenant = useMaintenant(60_000);
  const [periode, setPeriode] = useState<Periode>('jour');

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm rounded-full" />
        <Skeleton className="h-36 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      </div>
    );
  }
  if (isError) {
    return <p className="text-sm text-destructive">Impossible de charger vos ventes. Nouvel essai automatique…</p>;
  }

  const nbJours = JOURS_PAR_PERIODE[periode];
  const actuel = bilan(commandes, joursGlissants(nbJours, maintenant));
  const precedent = bilan(commandes, joursGlissants(nbJours, maintenant, nbJours));
  const { comparaison, precedent: libellePrecedent } = PERIODES.find((p) => p.valeur === periode)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Tableau des ventes</h1>
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

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-blue/90 p-6 text-white shadow-md">
        <div className="relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Chiffre d'affaires plats
          </span>
          <p className="mt-1.5 font-heading text-4xl sm:text-5xl font-bold tracking-tight">
            {formatPrixFcfa(actuel.chiffreAffaires)}
          </p>
          <div className="mt-3">
            <Evolution
              actuel={actuel.chiffreAffaires}
              precedent={precedent.chiffreAffaires}
              comparaison={comparaison}
              periodePrecedente={libellePrecedent}
            />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-6 -bottom-10 size-44 rounded-full bg-cyan-400/10 blur-2xl" />
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <Tuile
          label="Commandes servies"
          valeur={String(actuel.servies)}
          detail={`${precedent.servies} ${libellePrecedent}`}
          icone={PackageCheck}
        />
        <Tuile
          label="Panier moyen"
          valeur={actuel.panierMoyen === null ? '—' : formatPrixFcfa(actuel.panierMoyen)}
          detail="Par commande terminée"
          icone={Receipt}
        />
        <Tuile
          label="Refusées ou annulées"
          valeur={String(actuel.refusees + actuel.annulees)}
          detail={actuel.refusees > 0 ? `dont ${actuel.refusees} refusée${actuel.refusees > 1 ? 's' : ''} par vous` : undefined}
          icone={XCircle}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {nbJours > 1 && <VentesParJour parJour={actuel.parJour} />}
        <TopPlats plats={actuel.topPlats} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-xs text-muted-foreground">
        Montant brut de vos plats pour les commandes remises au livreur. Les frais de livraison et de service sont payés
        par le client en sus. Les relevés de reversement bancaire ou mobile money sont administrés par ChapExpress.
      </div>
    </div>
  );
}
