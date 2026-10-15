import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnnulerCommandeBouton } from '@/components/commandes/AnnulerCommandeBouton';
import { PaiementRecuBouton } from '@/components/commandes/PaiementRecuBouton';
import { fetchCommandesExport, useAttribuerCommande, useCommandesOverview } from '@/api/commandes';
import { useLivreurs } from '@/api/livreurs';
import { exporterCommandesCsv } from '@/lib/csv';
import { formatDateHeure, formatPrixFcfa } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminCommandeRow, TypeService } from '@/api/types';

const PAGE_SIZE = 20;

const TOUS_SERVICES: { value: TypeService | undefined; label: string }[] = [
  { value: undefined, label: 'Tous' },
  { value: 'repas', label: 'Repas' },
  { value: 'colis', label: 'Colis' },
  { value: 'emplettes', label: 'Emplettes' },
  { value: 'courses_express', label: 'Courses express' },
];

// Hors V1, plus aucune commande Emplettes n'est créée : le filtre dédié
// disparaît. Les éventuelles commandes Emplettes antérieures restent visibles
// via "Tous" et gardent leur libellé (SERVICE_LABELS ci-dessous est complet).
const SERVICES = TOUS_SERVICES.filter((s) => s.value !== 'emplettes' || EMPLETTES_ACTIF);

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

// Payment states the dispatcher has to act on or know about; a collected
// payment needs no mention.
const LIBELLES_PAIEMENT: Record<string, string> = {
  en_attente: 'Non payée',
  echoue: 'Paiement échoué',
  a_rembourser: 'À rembourser',
  rembourse: 'Remboursée',
};

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
        className="h-8 max-w-32 rounded-xl border border-input bg-card px-2 text-xs font-medium outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
        value={choix}
        onChange={(e) => setChoix(e.target.value)}
      >
        <option value="">Assigner à…</option>
        {livreurs?.map((livreur) => (
          <option key={livreur.id} value={livreur.id}>
            {livreur.user.nom}
          </option>
        ))}
      </select>
      <Button
        size="xs"
        variant="outline"
        className="h-8 rounded-xl px-2.5 text-xs font-semibold"
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
        className="h-8 rounded-xl px-2.5 text-xs font-bold bg-primary text-white hover:bg-primary/90"
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
  const [exportEnCours, setExportEnCours] = useState(false);

  const { data, isPending, isError } = useCommandesOverview({
    typeService,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const handleExportCsv = async () => {
    setExportEnCours(true);
    try {
      const rows = await fetchCommandesExport(typeService);
      if (!rows || rows.length === 0) {
        toast.info('Aucune commande à exporter.');
        return;
      }
      exporterCommandesCsv(rows, typeService ?? 'toutes');
      toast.success(`${rows.length} commande(s) exportée(s) en CSV.`);
    } catch (error) {
      toast.error((error as Error).message || 'Échec de l’export CSV.');
    } finally {
      setExportEnCours(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Gestion des commandes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Supervision du flux complet : attribution des livreurs, réassignation et suivi des paiements.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={exportEnCours}
          onClick={handleExportCsv}
          className="gap-2 rounded-full border-border/80 px-4 font-semibold shadow-2xs self-start sm:self-auto"
        >
          {exportEnCours ? (
            <>
              <Loader2 className="size-4 animate-spin text-primary" />
              Exportation...
            </>
          ) : (
            <>
              <Download className="size-4" />
              Exporter (CSV)
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SERVICES.map((service) => (
          <button
            key={service.label}
            type="button"
            onClick={() => {
              setTypeService(service.value);
              setPage(1);
            }}
            className={cn(
              'h-8.5 rounded-full px-4 text-xs font-semibold transition-all active:scale-95 shadow-2xs',
              typeService === service.value
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'bg-card text-muted-foreground hover:bg-muted border border-border/70 hover:text-foreground',
            )}
          >
            {service.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
          <p className="font-heading font-semibold text-base">Impossible de charger les commandes</p>
          <p className="mt-1 text-xs text-muted-foreground">Une erreur s'est produite lors de la communication avec l'API.</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-12 text-center shadow-xs">
          <p className="font-heading text-lg font-bold text-foreground">Aucune commande trouvée</p>
          <p className="mt-1 text-sm text-muted-foreground">Aucune commande ne correspond au filtre de service sélectionné.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Livreur</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Créée le</th>
                <th className="px-4 py-3">Actions de dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.items.map((row) => (
                <tr key={row.id} data-commande={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-foreground">{SERVICE_LABELS[row.typeService]}</div>
                    {row.nature && (
                      <div className="max-w-[12rem] truncate text-xs text-muted-foreground mt-0.5" title={row.nature}>
                        « {row.nature} »
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize shadow-2xs',
                        row.statut && STATUTS_TERMINAUX.has(row.statut)
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary border border-primary/20',
                      )}
                    >
                      {formatStatut(row.statut)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {row.client ? (
                      <div>
                        <div className="font-semibold text-foreground">{row.client.nom}</div>
                        <a href={`tel:${row.client.telephone}`} className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono">
                          {row.client.telephone}
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {row.livreur ? (
                      <div>
                        <div className="font-semibold text-foreground">{row.livreur.nom}</div>
                        <a href={`tel:${row.livreur.telephone}`} className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono">
                          {row.livreur.telephone}
                        </a>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-700 px-2 py-0.5 text-[11px] font-semibold">
                        Non assigné
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-mono font-bold text-foreground">{formatPrixFcfa(row.montantTotal)}</div>
                    {row.paiement && LIBELLES_PAIEMENT[row.paiement.statut] && (
                      <span
                        className={cn(
                          'inline-block mt-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                          row.paiement.statut === 'en_attente' && 'bg-amber-100 text-amber-900',
                          row.paiement.statut === 'echoue' && 'bg-destructive/15 text-destructive',
                          row.paiement.statut === 'a_rembourser' && 'bg-destructive text-white',
                        )}
                      >
                        {LIBELLES_PAIEMENT[row.paiement.statut]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                    {formatDateHeure(row.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AttributionCell row={row} />
                      <PaiementRecuBouton row={row} />
                      <AnnulerCommandeBouton row={row} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm pt-2">
          <span className="text-xs text-muted-foreground">
            Page <span className="font-bold text-foreground">{data.page}</span> sur {totalPages} · {data.total} commande(s) au total
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 text-xs font-semibold"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 text-xs font-semibold"
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
