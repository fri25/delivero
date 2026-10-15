import { MapPin, Info, Compass } from 'lucide-react';
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

  const total = quartiers?.length ?? 0;
  const actifs = quartiers?.filter((q) => q.actif).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" />
            </span>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Quartiers et tarification
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gestion du maillage géographique de Natitingou et de la grille tarifaire de livraison.
          </p>
        </div>

        {total > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {actifs} actif{actifs > 1 ? 's' : ''} sur {total}
            </span>
          </div>
        )}
      </div>

      {/* Info Callout */}
      <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs text-xs sm:text-sm text-muted-foreground">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <p>
          Règle tarifaire (Q-28) : Le quartier du client fixe les frais de livraison <strong className="text-foreground font-semibold">Repas</strong>, le prix d'un <strong className="text-foreground font-semibold">Colis</strong> (quartier du destinataire) et d'une <strong className="text-foreground font-semibold">Course express</strong> (quartier le plus cher × nombre d'arrêts). Toute modification n'affecte que les commandes futures.
        </p>
      </div>

      {/* New Neighbourhood Form */}
      <NouveauQuartierForm />

      {/* Neighbourhood Table */}
      {isPending ? (
        <div className="space-y-2 rounded-3xl border border-border/80 bg-card p-6 shadow-xs">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : !quartiers || quartiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
            <Compass className="size-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Aucun quartier configuré</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Ajoutez le premier quartier de Natitingou ci-dessus pour initialiser la grille tarifaire.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">
                <tr>
                  <th className="px-4 py-3.5">Quartier</th>
                  <th className="px-4 py-3.5">Frais de livraison</th>
                  <th className="px-4 py-3.5">Disponibilité</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {quartiers.map((quartier) => (
                  <QuartierLigne key={quartier.id} quartier={quartier} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
