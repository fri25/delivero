import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClotures, useRapprocherCloture } from '@/api/caisse';
import { exporterCaisseCsv } from '@/lib/csv';
import { formatDateHeure, formatPrixFcfa } from '@/lib/format';
import type { ClotureCaisse } from '@/api/types';

function ClotureRow({ cloture }: { cloture: ClotureCaisse }) {
  const rapprocher = useRapprocherCloture();
  const ecart = Number(cloture.ecart);

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3.5">
        <div className="font-semibold text-foreground">{cloture.livreur.user.nom}</div>
        <a href={`tel:${cloture.livreur.user.telephone}`} className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
          {cloture.livreur.user.telephone}
        </a>
      </td>
      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{formatDateHeure(cloture.createdAt)}</td>
      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">{formatPrixFcfa(cloture.montantTheorique)}</td>
      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">{formatPrixFcfa(cloture.montantDeclare)}</td>
      <td className="px-4 py-3.5 font-mono text-xs font-bold">
        <span
          className={
            ecart === 0
              ? 'text-muted-foreground'
              : ecart > 0
                ? 'text-emerald-600'
                : 'text-destructive'
          }
        >
          {ecart > 0 ? '+' : ''}
          {formatPrixFcfa(cloture.ecart)}
        </span>
      </td>
      <td className="px-4 py-3.5">
        {cloture.rapprocheeAt ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            ✓ Rapprochée par {cloture.rapprocheePar?.nom ?? 'Admin'}
          </span>
        ) : (
          <Button
            size="sm"
            className="h-8 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white"
            disabled={rapprocher.isPending}
            onClick={() => {
              rapprocher.mutate(cloture.id, {
                onSuccess: () => toast.success('Clôture de caisse rapprochée.'),
                onError: (error) => toast.error(error.message),
              });
            }}
          >
            Valider le rapprochement
          </Button>
        )}
      </td>
    </tr>
  );
}

export function CaissePage() {
  const { data: clotures, isPending } = useClotures();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Gestion de la caisse & clôtures</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivi des clôtures journalières déclarées par les livreurs et réconciliation comptable.
          </p>
        </div>
        {clotures && clotures.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              exporterCaisseCsv(clotures);
              toast.success(`${clotures.length} clôture(s) de caisse exportée(s) en CSV.`);
            }}
            className="gap-2 rounded-full border-border/80 px-4 font-semibold shadow-2xs self-start sm:self-auto"
          >
            <Download className="size-4" />
            Exporter (CSV)
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : !clotures || clotures.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-12 text-center shadow-xs">
          <p className="font-heading text-lg font-bold text-foreground">Aucune clôture de caisse</p>
          <p className="mt-1 text-sm text-muted-foreground">Les déclarations des livreurs apparaîtront ici à la fin de leur tournée.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Livreur</th>
                <th className="px-4 py-3">Date & Heure</th>
                <th className="px-4 py-3">Montant théorique</th>
                <th className="px-4 py-3">Montant déclaré</th>
                <th className="px-4 py-3">Écart de caisse</th>
                <th className="px-4 py-3">Statut de rapprochement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {clotures.map((cloture) => (
                <ClotureRow key={cloture.id} cloture={cloture} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
