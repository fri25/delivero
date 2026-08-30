import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortefeuille } from '@/api/livreur';
import { formatPrixFcfa } from '@/lib/format';

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
    </div>
  );
}
