import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAnnulerCommandeCoursesExpress,
  useCommandeCoursesExpress,
} from '@/api/commandes-courses-express';
import { CoursesExpressStatusStepper } from '@/components/orders/CoursesExpressStatusStepper';
import { formatPrixFcfa } from '@/lib/format';
import type { EtapeCourseExpress } from '@/api/types';

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  especes: 'Espèces à la remise',
  mobile_money: 'Mobile Money',
};

function EtapeRow({ etape }: { etape: EtapeCourseExpress }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <div>
        <p className="text-sm font-medium">
          Étape {etape.ordre} — {etape.description}
        </p>
        <p className="text-xs text-muted-foreground">{etape.pointDeRepere}</p>
      </div>
      <span
        className={
          etape.realisee
            ? 'shrink-0 text-xs font-medium text-success'
            : 'shrink-0 text-xs text-muted-foreground'
        }
      >
        {etape.realisee ? 'Réalisée' : 'En attente'}
      </span>
    </div>
  );
}

export function CoursesExpressOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: commande, isPending } = useCommandeCoursesExpress(id);
  const annuler = useAnnulerCommandeCoursesExpress();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!commande) {
    return <p className="text-sm text-destructive">Commande introuvable.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{commande.description}</h1>
        <p className="text-sm text-muted-foreground">
          Demandé le {new Date(commande.createdAt).toLocaleString('fr-FR')}
        </p>
      </div>

      <CoursesExpressStatusStepper statut={commande.statut} motif={commande.motif} />

      <div>
        {commande.etapes.map((etape) => (
          <EtapeRow key={etape.id} etape={etape} />
        ))}
      </div>

      <div className="space-y-1 border-t border-border pt-3 text-sm">
        {commande.commande.paiement && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Paiement</span>
            <span>
              {MODE_PAIEMENT_LABELS[commande.commande.paiement.mode] ?? commande.commande.paiement.mode}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 font-medium text-foreground">
          <span>Total</span>
          <span>{commande.commande.montantTotal ? formatPrixFcfa(commande.commande.montantTotal) : '—'}</span>
        </div>
      </div>

      {commande.statut === 'confirmee' && (
        <Button
          variant="outline"
          className="w-full"
          disabled={annuler.isPending}
          onClick={() => {
            annuler.mutate(commande.id, {
              onSuccess: () => toast.success('Commande annulée.'),
              onError: (error) => toast.error(error.message),
            });
          }}
        >
          Annuler la commande
        </Button>
      )}
    </div>
  );
}
