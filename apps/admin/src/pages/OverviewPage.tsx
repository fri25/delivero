import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttribuerCommande, useCommandesOverview } from '@/api/commandes';
import { useLivreurs } from '@/api/livreurs';
import { formatDateHeure, formatPrixFcfa } from '@/lib/format';
import type { AdminCommandeRow, TypeService } from '@/api/types';

const PAGE_SIZE = 20;

const SERVICES: { value: TypeService | undefined; label: string }[] = [
  { value: undefined, label: 'Tous' },
  { value: 'repas', label: 'Repas' },
  { value: 'colis', label: 'Colis' },
  { value: 'emplettes', label: 'Emplettes' },
  { value: 'courses_express', label: 'Courses express' },
];

const SERVICE_LABELS: Record<TypeService, string> = {
  repas: 'Repas',
  colis: 'Colis',
  emplettes: 'Emplettes',
  courses_express: 'Courses express',
};

// Statuts "en cours" par service (ni terminal ni en attente initiale) : sert
// uniquement à une mise en forme visuelle plus lisible, pas à une logique
// métier — pas de statut agrégé unique au niveau Commande (voir
// schema.prisma).
const STATUTS_TERMINAUX = new Set([
  'livree',
  'livre',
  'terminee',
  'annulee',
  'refusee',
  'litige',
]);

function formatStatut(statut: string | null): string {
  if (!statut) return '—';
  return statut.replaceAll('_', ' ');
}

// F-ADM-02/03 : "Auto" applique la rotation (RG-14) et respecte les
// plafonds ; le menu manuel contourne volontairement zone et plafonds (le
// dispatcher est de confiance pour un cas particulier).
function AttributionCell({ row }: { row: AdminCommandeRow }) {
  const { data: livreurs } = useLivreurs();
  const attribuer = useAttribuerCommande();
  const [choix, setChoix] = useState('');
  const estTerminale = row.statut !== null && STATUTS_TERMINAUX.has(row.statut);

  if (estTerminale) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        className="h-8 max-w-32 rounded-lg border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={choix}
        onChange={(e) => setChoix(e.target.value)}
      >
        <option value="">Choisir…</option>
        {livreurs?.map((livreur) => (
          <option key={livreur.id} value={livreur.id}>
            {livreur.user.nom}
          </option>
        ))}
      </select>
      <Button
        size="xs"
        variant="outline"
        disabled={!choix || attribuer.isPending}
        onClick={() => {
          attribuer.mutate(
            { id: row.id, livreurId: choix },
            {
              onSuccess: () => {
                toast.success('Commande réattribuée.');
                setChoix('');
              },
              onError: (error) => toast.error(error.message),
            },
          );
        }}
      >
        Assigner
      </Button>
      <Button
        size="xs"
        disabled={attribuer.isPending}
        onClick={() => {
          attribuer.mutate(
            { id: row.id },
            {
              onSuccess: () => toast.success('Commande attribuée automatiquement.'),
              onError: (error) => toast.error(error.message),
            },
          );
        }}
      >
        Auto
      </Button>
    </div>
  );
}

export function OverviewPage() {
  const [typeService, setTypeService] = useState<TypeService | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isPending, isError } = useCommandesOverview({
    typeService,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Vue d'ensemble</h1>
        <p className="text-sm text-muted-foreground">
          Toutes les demandes, tous services confondus.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SERVICES.map((service) => (
          <Button
            key={service.label}
            size="sm"
            variant={typeService === service.value ? 'default' : 'outline'}
            onClick={() => {
              setTypeService(service.value);
              setPage(1);
            }}
          >
            {service.label}
          </Button>
        ))}
      </div>

      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          Impossible de charger les commandes.
        </p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune commande pour ce filtre.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Service</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Livreur</th>
                <th className="px-3 py-2 font-medium">Montant</th>
                <th className="px-3 py-2 font-medium">Créée le</th>
                <th className="px-3 py-2 font-medium">Attribution</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2">{SERVICE_LABELS[row.typeService]}</td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={
                        row.statut && STATUTS_TERMINAUX.has(row.statut) ? 'outline' : 'default'
                      }
                    >
                      {formatStatut(row.statut)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    {row.client ? (
                      <>
                        <div>{row.client.nom}</div>
                        <div className="text-xs text-muted-foreground">{row.client.telephone}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.livreur ? (
                      <>
                        <div>{row.livreur.nom}</div>
                        <div className="text-xs text-muted-foreground">{row.livreur.telephone}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2">{formatPrixFcfa(row.montantTotal)}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDateHeure(row.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <AttributionCell row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.page} / {totalPages} — {data.total} commande(s)
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
