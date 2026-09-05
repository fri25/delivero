import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClotures, useRapprocherCloture } from '@/api/caisse';
import { formatDateHeure, formatPrixFcfa } from '@/lib/format';
import type { ClotureCaisse } from '@/api/types';

function ClotureRow({ cloture }: { cloture: ClotureCaisse }) {
  const rapprocher = useRapprocherCloture();
  const ecart = Number(cloture.ecart);

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2">
        <div className="font-medium">{cloture.livreur.user.nom}</div>
        <div className="text-xs text-muted-foreground">{cloture.livreur.user.telephone}</div>
      </td>
      <td className="px-3 py-2">{formatDateHeure(cloture.createdAt)}</td>
      <td className="px-3 py-2">{formatPrixFcfa(cloture.montantTheorique)}</td>
      <td className="px-3 py-2">{formatPrixFcfa(cloture.montantDeclare)}</td>
      <td className="px-3 py-2">
        <span className={ecart === 0 ? '' : ecart > 0 ? 'text-success' : 'text-destructive'}>
          {ecart > 0 ? '+' : ''}
          {formatPrixFcfa(cloture.ecart)}
        </span>
      </td>
      <td className="px-3 py-2">
        {cloture.rapprocheeAt ? (
          <Badge variant="outline">Rapprochée par {cloture.rapprocheePar?.nom ?? '—'}</Badge>
        ) : (
          <Button
            size="sm"
            disabled={rapprocher.isPending}
            onClick={() => {
              rapprocher.mutate(cloture.id, {
                onSuccess: () => toast.success('Clôture rapprochée.'),
                onError: (error) => toast.error(error.message),
              });
            }}
          >
            Marquer rapprochée
          </Button>
        )}
      </td>
    </tr>
  );
}

export function CaissePage() {
  const { data: clotures, isPending } = useClotures();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Caisse</h1>
        <p className="text-sm text-muted-foreground">
          Clôtures journalières déclarées par les livreurs (F-ADM-13) et rapprochement (F-ADM-12,
          RG-03). Le rapprochement prend acte de l'écart, il ne le corrige pas — la procédure en
          cas d'écart reste à arbitrer.
        </p>
      </div>

      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : !clotures || clotures.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune clôture de caisse pour l'instant.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Livreur</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Montant théorique</th>
                <th className="px-3 py-2 font-medium">Montant déclaré</th>
                <th className="px-3 py-2 font-medium">Écart</th>
                <th className="px-3 py-2 font-medium">Rapprochement</th>
              </tr>
            </thead>
            <tbody>
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
