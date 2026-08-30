import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <CardTitle>Aujourd'hui</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {totalCourses === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune course livrée aujourd'hui.</p>
        ) : (
          <div className="flex flex-wrap gap-4 text-sm">
            {(Object.entries(recap.parService) as [TypeService, number][])
              .filter(([, nombre]) => nombre > 0)
              .map(([service, nombre]) => (
                <div key={service}>
                  <span className="text-lg font-semibold">{nombre}</span>{' '}
                  <span className="text-muted-foreground">{LABELS_SERVICE[service]}</span>
                </div>
              ))}
          </div>
        )}
        <div className="flex flex-wrap gap-6 border-t border-border pt-3 text-sm">
          <div>
            <div className="text-muted-foreground">Encaissé aujourd'hui</div>
            <div className="font-medium">{formatPrixFcfa(recap.encaisseAujourdhui)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Avancé aujourd'hui (Emplettes)</div>
            <div className="font-medium">{formatPrixFcfa(recap.avanceAujourdhui)}</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ne montre pas vos gains : le mode de rémunération par course n'est pas encore défini
          par ChapExpress.
        </p>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>{titre}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold">{formatPrixFcfa(montant)}</p>
        <p className="text-sm text-muted-foreground">
          Plafond : {formatPrixFcfa(plafond)}
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={proche ? 'h-full bg-destructive' : 'h-full bg-brand-green'}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        {proche && (
          <p className="text-sm text-destructive">
            Proche du plafond — régularisez avant de reprendre une course en espèces.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ClotureCaisseForm() {
  const cloturerCaisse = useCloturerCaisse();
  const [montantDeclare, setMontantDeclare] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clôturer ma caisse du jour</CardTitle>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-1.5">
            <Label htmlFor="montant-declare">Montant en espèces compté (FCFA)</Label>
            <Input
              id="montant-declare"
              type="number"
              min="0"
              className="w-40"
              value={montantDeclare}
              onChange={(e) => setMontantDeclare(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={cloturerCaisse.isPending}>
            Clôturer
          </Button>
        </form>
        <p className="mt-2 text-sm text-muted-foreground">
          Une seule clôture par jour. Le montant théorique (encaissements non encore clôturés)
          est comparé à ce que vous comptez ; l'écart est transmis au dispatcher.
        </p>
      </CardContent>
    </Card>
  );
}

function ClotureRow({ cloture }: { cloture: ClotureCaisse }) {
  const ecart = Number(cloture.ecart);
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2">{formatDateHeure(cloture.createdAt)}</td>
      <td className="px-3 py-2">{formatPrixFcfa(cloture.montantTheorique)}</td>
      <td className="px-3 py-2">{formatPrixFcfa(cloture.montantDeclare)}</td>
      <td className="px-3 py-2">
        <span className={ecart === 0 ? '' : ecart > 0 ? 'text-brand-green' : 'text-destructive'}>
          {ecart > 0 ? '+' : ''}
          {formatPrixFcfa(cloture.ecart)}
        </span>
      </td>
      <td className="px-3 py-2 text-muted-foreground">
        {cloture.rapprocheeAt ? 'Rapprochée' : 'En attente'}
      </td>
    </tr>
  );
}

function HistoriqueClotures() {
  const { data: clotures, isPending } = useClotures();

  if (isPending) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!clotures || clotures.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune clôture pour l'instant.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Mon portefeuille</h1>
        <p className="text-sm text-muted-foreground">
          Avance en cours (Emplettes financées par vous) et solde en espèces à reverser à
          ChapExpress (Repas, Colis, Courses express, Emplettes). Mis à jour à chaque course
          prise ou livrée.
        </p>
      </div>

      <RecapJournalierCard />

      <div className="grid gap-4 sm:grid-cols-2">
        <SoldeCard
          titre="Avance en cours"
          montant={portefeuille.avanceEnCours}
          plafond={portefeuille.plafondAvance}
        />
        <SoldeCard
          titre="Solde à reverser"
          montant={portefeuille.caisseAReverser}
          plafond={portefeuille.plafondCaisse}
        />
      </div>

      <ClotureCaisseForm />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Historique des clôtures</h2>
        <HistoriqueClotures />
      </div>
    </div>
  );
}
