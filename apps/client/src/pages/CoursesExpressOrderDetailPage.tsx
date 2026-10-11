import { Link, useParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { modeleCoursesExpress } from '@/lib/recommander';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAnnulerCommandeCoursesExpress,
  useCommandeCoursesExpress,
} from '@/api/commandes-courses-express';
import { PaiementStatus } from '@/components/paiement/PaiementStatus';
import { LivreurCard } from '@/components/orders/LivreurCard';
import { NotationCard } from '@/components/orders/NotationCard';
import { useNoterCommande } from '@/api/notations';
import { isStatutCoursesExpressActif } from '@/lib/statut-courses-express';
import { CoursesExpressStatusStepper } from '@/components/orders/CoursesExpressStatusStepper';
import { formatPrixFcfa } from '@/lib/format';
import { miniature } from '@/lib/medias';
import type { EtapeCourseExpress } from '@/api/types';
import { AvisCommandeSection } from '@/components/orders/AvisCommandeSection';
import { LoadError } from '@/components/layout/LoadError';

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
  const { data: commande, isPending, isError, refetch } = useCommandeCoursesExpress(id);
  const annuler = useAnnulerCommandeCoursesExpress();
  const noter = useNoterCommande(['commande-courses-express', id]);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) return <LoadError message="Le suivi de cette course n’a pas pu être chargé." onRetry={() => void refetch()} />;

  if (!commande) {
    return <p className="text-sm text-destructive">Commande introuvable.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{commande.description}</h1>
        <p className="text-sm text-muted-foreground">
          Demandé le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' }).format(new Date(commande.createdAt))}
        </p>
      </div>

      <CoursesExpressStatusStepper statut={commande.statut} motif={commande.motif} />

      {commande.photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {commande.photoUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <img
                src={miniature(url)}
                alt="Photo jointe"
                loading="lazy"
                className="size-24 rounded-lg object-cover ring-1 ring-foreground/10"
              />
            </a>
          ))}
        </div>
      )}

      <PaiementStatus
        commandeId={commande.commande.id}
        paiement={commande.commande.paiement}
        montantTotal={commande.commande.montantTotal}
        commandeClose={commande.statut === 'annulee'}
      />

      <LivreurCard livreur={commande.commande.livreur} actif={isStatutCoursesExpressActif(commande.statut)} />

      <NotationCard
        livree={commande.statut === 'terminee'}
        cibles={[
          ...(commande.commande.livreur
            ? [{ cible: 'livreur' as const, libelle: `Votre livreur, ${commande.commande.livreur.user.nom}` }]
            : []),
        ]}
        notations={commande.commande.notations}
        enCours={noter.isPending}
        onNoter={(notes, callbacks) => noter.mutate({ commandeId: commande.commande.id, notes }, callbacks)}
      />

      <div>
        {commande.etapes.map((etape) => (
          <EtapeRow key={etape.id} etape={etape} />
        ))}
      </div>

      <div className="space-y-1 border-t border-border pt-3 text-sm">
        {commande.commande.paiement && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Mode de paiement</span>
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

      <AvisCommandeSection commandeId={commande.id} prestationTerminee={commande.statut === 'terminee'} />

      {!isStatutCoursesExpressActif(commande.statut) && (
        <Button asChild className="w-full">
          <Link to="/courses-express" state={{ modele: modeleCoursesExpress(commande) }}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Refaire cette course
          </Link>
        </Button>
      )}

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
