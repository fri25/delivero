import { EMPLETTES_ACTIF, ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useClotures, useCloturerCaisse, usePortefeuille, useRecapJournalier } from '@/api/livreur';
import { formatDateHeure, formatPrixFcfa } from '@/lib/format';
import type { ClotureCaisse, TypeService } from '@/api/types';

const LABELS_SERVICE: Record<TypeService, string> = {
  repas: 'Repas',
  colis: 'Colis',
  emplettes: 'Emplettes',
  courses_express: 'Courses express',
};

function RecapJournalierCard() {
  const { data: recap, isPending } = useRecapJournalier();

  if (isPending) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!recap) {
    return null;
  }

  const totalCourses = Object.values(recap.parService).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <h2 className="font-heading text-base font-bold text-foreground">Activité du jour</h2>
        <span className="text-xs text-muted-foreground font-medium">Aujourd'hui</span>
      </div>

      <div className="space-y-4">
        {totalCourses === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground">Aucune course livrée aujourd'hui.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(Object.entries(recap.parService) as [TypeService, number][])
              .filter(([, nombre]) => nombre > 0)
              .map(([service, nombre]) => (
                <div key={service} className="rounded-2xl bg-secondary/40 border border-border/50 p-3 text-center">
                  <span className="font-heading text-2xl font-bold text-primary block">{nombre}</span>
                  <span className="text-xs font-semibold text-muted-foreground mt-0.5 block">{LABELS_SERVICE[service]}</span>
                </div>
              ))}
          </div>
        )}

        {(ESPECES_ACTIF || EMPLETTES_ACTIF || recap.encaisseAujourdhui > 0) && (
          <div className="flex flex-wrap gap-4 border-t border-border/50 pt-3 text-xs sm:text-sm">
            {(ESPECES_ACTIF || recap.encaisseAujourdhui > 0) && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2">
                <span className="text-xs text-amber-800 dark:text-amber-300 font-medium block">Encaissé aujourd'hui</span>
                <span className="font-heading text-base font-extrabold text-amber-950 dark:text-amber-100 block">
                  {formatPrixFcfa(recap.encaisseAujourdhui)}
                </span>
              </div>
            )}
            {EMPLETTES_ACTIF && (
              <div className="rounded-2xl bg-secondary/60 border border-border/60 px-3.5 py-2">
                <span className="text-xs text-muted-foreground font-medium block">Avancé aujourd'hui (Emplettes)</span>
                <span className="font-heading text-base font-bold text-foreground block">
                  {formatPrixFcfa(recap.avanceAujourdhui)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl bg-primary/5 border border-primary/15 p-3 text-xs text-muted-foreground leading-relaxed">
          ℹ️ La rémunération par course est masquée pour cette version (non définie dans le périmètre actuel).
        </div>
      </div>
    </div>
  );
}

function SoldeCard({
  titre,
  montant,
  plafond,
}: {
  titre: string;
  montant: number;
  plafond: number;
}) {
  const ratio = plafond > 0 ? Math.min(montant / plafond, 1) : 0;
  const proche = ratio >= 0.8;

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-3">
      <h2 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">{titre}</h2>
      <div className="space-y-2">
        <p className="font-heading text-2xl font-bold text-foreground">{formatPrixFcfa(montant)}</p>
        <p className="text-xs text-muted-foreground font-medium">
          Plafond autorisé : {formatPrixFcfa(plafond)}
        </p>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={proche ? 'h-full bg-destructive transition-all' : 'h-full bg-emerald-500 transition-all'}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        {proche && (
          <p className="text-xs font-semibold text-destructive mt-1">
            ⚠️ Proche du plafond — effectuez un versement avant de reprendre des courses en espèces.
          </p>
        )}
      </div>
    </div>
  );
}

function ClotureCaisseForm() {
  const cloturerCaisse = useCloturerCaisse();
  const [montantDeclare, setMontantDeclare] = useState('');

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-4">
      <div className="border-b border-border/50 pb-3">
        <h2 className="font-heading text-base font-bold text-foreground">Clôturer ma caisse du jour</h2>
      </div>
      <div>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            cloturerCaisse.mutate(Number(montantDeclare), {
              onSuccess: (cloture) => {
                const ecart = Number(cloture.ecart);
                toast.success(
                  ecart === 0
                    ? 'Caisse clôturée, aucun écart.'
                    : `Caisse clôturée, écart de ${formatPrixFcfa(cloture.ecart)}.`,
                );
                setMontantDeclare('');
              },
              onError: (error) => toast.error(error.message),
            });
          }}
        >
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label htmlFor="montant-declare">Montant en espèces compté (FCFA)</Label>
            <Input
              id="montant-declare"
              type="number"
              min="0"
              className="rounded-xl"
              value={montantDeclare}
              onChange={(e) => setMontantDeclare(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="default" className="rounded-xl font-bold shadow-md shadow-primary/20" disabled={cloturerCaisse.isPending}>
            {cloturerCaisse.isPending ? 'En cours...' : 'Clôturer la caisse'}
          </Button>
        </form>
        <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
          Une seule clôture par jour. Le montant théorique (encaissements non encore clôturés)
          est comparé à ce que vous comptez ; l'écart est transmis au dispatcher.
        </p>
      </div>
    </div>
  );
}

function ClotureRow({ cloture }: { cloture: ClotureCaisse }) {
  const ecart = Number(cloture.ecart);
  return (
    <tr className="border-t border-border/60">
      <td className="px-3.5 py-2.5 text-xs sm:text-sm font-medium">{formatDateHeure(cloture.createdAt)}</td>
      <td className="px-3.5 py-2.5 text-xs sm:text-sm">{formatPrixFcfa(cloture.montantTheorique)}</td>
      <td className="px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground">{formatPrixFcfa(cloture.montantDeclare)}</td>
      <td className="px-3.5 py-2.5 text-xs sm:text-sm font-bold">
        <span className={ecart === 0 ? 'text-muted-foreground' : ecart > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
          {ecart > 0 ? '+' : ''}
          {formatPrixFcfa(cloture.ecart)}
        </span>
      </td>
      <td className="px-3.5 py-2.5 text-xs">
        <span className={cloture.rapprocheeAt ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400' : 'rounded-full bg-secondary px-2 py-0.5 text-muted-foreground'}>
          {cloture.rapprocheeAt ? 'Rapprochée' : 'En attente'}
        </span>
      </td>
    </tr>
  );
}

function HistoriqueClotures() {
  const { data: clotures, isPending } = useClotures();

  if (isPending) {
    return <Skeleton className="h-24 w-full rounded-2xl" />;
  }

  if (!clotures || clotures.length === 0) {
    return ESPECES_ACTIF ? (
      <p className="text-xs sm:text-sm text-muted-foreground">Aucune clôture pour l'instant.</p>
    ) : null;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary/40 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Théorique</th>
            <th className="px-3 py-2 font-medium">Déclaré</th>
            <th className="px-3 py-2 font-medium">Écart</th>
            <th className="px-3 py-2 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody>
          {clotures.map((cloture) => (
            <ClotureRow key={cloture.id} cloture={cloture} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PortefeuillePage() {
  const { data: portefeuille, isPending } = usePortefeuille();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!portefeuille) {
    return (
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Mon portefeuille</h1>
        <p className="text-sm text-muted-foreground">Impossible de charger le portefeuille.</p>
      </div>
    );
  }

  // Hors V1 (paiement Mobile Money uniquement), aucune espèce n'est collecté :
  // le solde, la clôture et son historique n'ont rien à montrer. Ils restent
  // visibles dès qu'un solde existe (ex. contre-remboursement Colis créé
  // avant le retrait des espèces) pour que le livreur puisse le clôturer.
  const afficherCaisse = ESPECES_ACTIF || portefeuille.caisseAReverser > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold lg:text-3xl text-foreground">Mon portefeuille</h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {EMPLETTES_ACTIF
            ? 'Avance en cours (Emplettes financées par vous) et solde en espèces à reverser à ChapExpress (Repas, Colis, Courses express, Emplettes).'
            : afficherCaisse
              ? 'Solde en espèces à reverser à ChapExpress (Repas, Colis, Courses express).'
              : "Les paiements se font par Mobile Money : vous n'avez aucune espèce à reverser à ChapExpress."}{' '}
          Mis à jour à chaque course prise ou livrée.
        </p>
      </div>

      <RecapJournalierCard />

      {(EMPLETTES_ACTIF || afficherCaisse) && (
        <div className={EMPLETTES_ACTIF && afficherCaisse ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4'}>
          {EMPLETTES_ACTIF && (
            <SoldeCard
              titre="Avance en cours"
              montant={portefeuille.avanceEnCours}
              plafond={portefeuille.plafondAvance}
            />
          )}
          {afficherCaisse && (
            <SoldeCard
              titre="Solde à reverser"
              montant={portefeuille.caisseAReverser}
              plafond={portefeuille.plafondCaisse}
            />
          )}
        </div>
      )}

      {afficherCaisse && <ClotureCaisseForm />}

      {(ESPECES_ACTIF || afficherCaisse) && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Historique des clôtures</h2>
          <HistoriqueClotures />
        </div>
      )}
    </div>
  );
}
