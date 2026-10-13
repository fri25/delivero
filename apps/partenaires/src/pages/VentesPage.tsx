import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
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
  if (pourcentage === null) return <p className="text-sm text-white/75">Aucune vente {periodePrecedente} pour comparer</p>;
  const hausse = pourcentage >= 0;
  const Icone = hausse ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm text-white/75">
      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white">
        <Icone className="size-4" aria-hidden="true" />
        {hausse ? '+' : ''}
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

/** Daily sales as columns, one hue; hover or focus a day for its figures. */
function VentesParJour({ parJour }: { parJour: Bilan['parJour'] }) {
  const max = Math.max(...parJour.map((jour) => jour.montant), 1);
  const etiquetteTous = parJour.length <= 7;
  return (
    <section className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="font-heading font-semibold">Ventes par jour</h2>
      <div className="flex h-40 items-end gap-0.5" aria-hidden="true">
        {parJour.map((jour) => (
          <div key={jour.jour} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={-1}>
            <div
              className={cn(
                'w-full max-w-10 rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80',
                jour.montant === 0 && 'bg-muted',
              )}
              style={{ height: jour.montant === 0 ? 2 : `${Math.max((jour.montant / max) * 100, 3)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-xs whitespace-nowrap text-background shadow-lg group-hover:block">
              <p className="font-semibold">{jourLisible(jour.jour, formatJourSemaine)}</p>
              <p>{formatPrixFcfa(jour.montant)}</p>
              <p className="opacity-75">
                {jour.commandes} commande{jour.commandes > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 border-t border-border pt-1.5 text-[11px] text-muted-foreground" aria-hidden="true">
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
    <section className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="font-heading font-semibold">Plats les plus vendus</h2>
      {plats.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun plat vendu sur la période.</p>
      ) : (
        <ol className="space-y-3">
          {plats.map((plat) => (
            <li key={plat.nom} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{plat.nom}</span>
                <span className="shrink-0 text-muted-foreground">
                  <span className="font-semibold text-foreground">{plat.quantite}</span> vendu
                  {plat.quantite > 1 ? 's' : ''} · {formatPrixFcfa(plat.montant)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(plat.quantite / max) * 100}%` }} />
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
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-full" />
        <Skeleton className="h-32 w-full rounded-2xl" />
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-semibold">Ventes</h1>
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

      <section className="rounded-2xl bg-brand-navy p-5 text-white">
        <p className="text-sm text-white/75">Vos ventes</p>
        <p className="mt-1 font-heading text-5xl font-semibold tracking-tight">
          {formatPrixFcfa(actuel.chiffreAffaires)}
        </p>
        <div className="mt-2">
          <Evolution
            actuel={actuel.chiffreAffaires}
            precedent={precedent.chiffreAffaires}
            comparaison={comparaison}
            periodePrecedente={libellePrecedent}
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tuile
          label="Commandes servies"
          valeur={String(actuel.servies)}
          detail={`${precedent.servies} ${libellePrecedent}`}
        />
        <Tuile
          label="Panier moyen"
          valeur={actuel.panierMoyen === null ? '—' : formatPrixFcfa(actuel.panierMoyen)}
        />
        <Tuile
          label="Refusées ou annulées"
          valeur={String(actuel.refusees + actuel.annulees)}
          detail={actuel.refusees > 0 ? `dont ${actuel.refusees} refusée${actuel.refusees > 1 ? 's' : ''} par vous` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {nbJours > 1 && <VentesParJour parJour={actuel.parJour} />}
        <TopPlats plats={actuel.topPlats} />
      </div>

      <p className="text-xs text-muted-foreground">
        Montant de vos plats pour les commandes remises au livreur. Les frais de livraison et de service sont payés
        par le client en plus. Les relevés de reversement ne sont pas encore disponibles ici.
      </p>
    </div>
  );
}
