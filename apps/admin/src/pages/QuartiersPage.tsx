import { Skeleton } from '@/components/ui/skeleton';
import { NouveauQuartierForm } from '@/components/quartiers/NouveauQuartierForm';
import { QuartierLigne } from '@/components/quartiers/QuartierLigne';
import { useQuartiers } from '@/api/quartiers';

/**
 * Neighbourhoods and their delivery price (Q-28, decided 13/10): the client's
 * neighbourhood sets the Repas delivery fee, the Colis price and the Courses
 * express price (dearest stop × number of stops).
 */
export function QuartiersPage() {
  const { data: quartiers, isPending } = useQuartiers();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Quartiers et prix de livraison</h1>
        <p className="text-sm text-muted-foreground">
          Le quartier du client fixe les frais de livraison Repas, le prix d’un Colis (quartier du destinataire) et
          d’une Course (quartier le plus cher × nombre d’arrêts). Un changement de prix ne vaut que pour les
          nouvelles commandes.
        </p>
      </div>

      <NouveauQuartierForm />

      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : !quartiers || quartiers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun quartier.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Quartier</th>
                <th className="px-3 py-2 font-medium">Prix livraison</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {quartiers.map((quartier) => (
                <QuartierLigne key={quartier.id} quartier={quartier} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
