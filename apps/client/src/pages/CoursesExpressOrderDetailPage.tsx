import { Link, useParams } from 'react-router-dom';
import { Check, RotateCcw } from 'lucide-react';
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
import { CarteDetail } from '@/components/orders/CarteDetail';
import { DetailCommandeLayout } from '@/components/orders/DetailCommandeLayout';
import { useNoterCommande } from '@/api/notations';
import { isStatutCoursesExpressActif } from '@/lib/statut-courses-express';
import { CoursesExpressStatusStepper } from '@/components/orders/CoursesExpressStatusStepper';
import { formatPrixFcfa } from '@/lib/format';
import { miniature } from '@/lib/medias';
import { cn } from '@/lib/utils';
import { LoadError } from '@/components/layout/LoadError';

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  especes: 'Espèces à la remise',
  mobile_money: 'Mobile Money',
};

export function CoursesExpressOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: commande, isPending, isError, refetch } = useCommandeCoursesExpress(id);
  const annuler = useAnnulerCommandeCoursesExpress();
  const noter = useNoterCommande(['commande-courses-express', id]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) return <LoadError message="Le suivi de cette course n’a pas pu être chargé." onRetry={() => void refetch()} />;

  if (!commande) {
    return <p className="text-sm text-destructive">Commande introuvable.</p>;
  }

  const actif = isStatutCoursesExpressActif(commande.statut);
  const realisees = commande.etapes.filter((etape) => etape.realisee).length;

  return (
    <DetailCommandeLayout
      service="Course en ville"
      titre={commande.description}
      date={commande.createdAt}
      reference={commande.commande.id}
      suivi={
        <CoursesExpressStatusStepper statut={commande.statut} motif={commande.motif} paiement={commande.commande.paiement} />
      }
      actions={
        <>
          <PaiementStatus
            commandeId={commande.commande.id}
            paiement={commande.commande.paiement}
            montantTotal={commande.commande.montantTotal}
            commandeClose={commande.statut === 'annulee'}
          />
          <LivreurCard livreur={commande.commande.livreur} actif={actif} />
          {!actif && (
            <Button asChild size="lg" className="w-full">
              <Link to="/courses-express" state={{ modele: modeleCoursesExpress(commande) }}>
                <RotateCcw aria-hidden="true" />
                Refaire cette course
              </Link>
            </Button>
          )}
          {commande.statut === 'confirmee' && (
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              disabled={annuler.isPending}
              onClick={() => {
                annuler.mutate(commande.id, {
                  onSuccess: () => toast.success('Commande annulée.'),
                  onError: (error) => toast.error(error.message),
                });
              }}
            >
              Annuler la course
            </Button>
          )}
        </>
      }
    >
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

      <CarteDetail
        titre="Les arrêts"
        action={
          <span className="text-sm text-muted-foreground">
            {realisees}/{commande.etapes.length} réalisé{realisees > 1 ? 's' : ''}
          </span>
        }
      >
        <ol className="space-y-3">
          {commande.etapes.map((etape) => (
            <li key={etape.id} className="flex items-start gap-3">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  etape.realisee ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary',
                )}
              >
                {etape.realisee ? <Check className="size-4" aria-label="Réalisé" /> : etape.ordre}
              </span>
              <div className="min-w-0 pt-0.5 text-sm">
                <p className="font-medium">{etape.description}</p>
                <p className="text-muted-foreground">
                  {etape.pointDeRepere}
                  {etape.adresse ? ` — ${etape.adresse}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {commande.photoUrls.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {commande.photoUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img
                  src={miniature(url)}
                  alt="Photo jointe"
                  loading="lazy"
                  className="size-20 rounded-xl object-cover ring-1 ring-foreground/10"
                />
              </a>
            ))}
          </div>
        )}

        <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
          {commande.commande.paiement && (
            <div className="flex justify-between text-muted-foreground">
              <dt>Paiement</dt>
              <dd>{MODE_PAIEMENT_LABELS[commande.commande.paiement.mode] ?? commande.commande.paiement.mode}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between text-foreground">
            <dt className="font-semibold">Total</dt>
            <dd className="font-heading text-xl font-semibold">
              {commande.commande.montantTotal ? formatPrixFcfa(commande.commande.montantTotal) : '—'}
            </dd>
          </div>
        </dl>
      </CarteDetail>
    </DetailCommandeLayout>
  );
}
