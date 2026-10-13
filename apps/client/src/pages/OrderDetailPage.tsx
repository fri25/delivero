import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnnulerCommande, useCommandeRepas } from '@/api/commandes-repas';
import { OrderStatusStepper } from '@/components/orders/OrderStatusStepper';
import { PaiementStatus } from '@/components/paiement/PaiementStatus';
import { LivreurCard } from '@/components/orders/LivreurCard';
import { NotationCard } from '@/components/orders/NotationCard';
import { CarteDetail } from '@/components/orders/CarteDetail';
import { DetailCommandeLayout } from '@/components/orders/DetailCommandeLayout';
import { useNoterCommande } from '@/api/notations';
import { useRecommanderRepas } from '@/lib/recommander';
import { isStatutRepasActif } from '@/lib/statut-repas';
import { formatPrixFcfa } from '@/lib/format';
import { LoadError } from '@/components/layout/LoadError';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: commande, isPending, isError, refetch } = useCommandeRepas(id);
  const annuler = useAnnulerCommande();
  const noter = useNoterCommande(['commande-repas', id]);
  const { recommander, enCours: recommandationEnCours } = useRecommanderRepas();

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) return <LoadError message="Le détail de la commande n’a pas pu être chargé." onRetry={() => void refetch()} />;

  if (!commande) {
    return <p className="text-sm text-destructive">Commande introuvable.</p>;
  }

  const actif = isStatutRepasActif(commande.statut);

  return (
    <DetailCommandeLayout
      service="Repas"
      titre={commande.partenaire.nom}
      date={commande.createdAt}
      reference={commande.commande.id}
      suivi={
        <OrderStatusStepper statut={commande.statut} motifRefus={commande.motifRefus} paiement={commande.commande.paiement} />
      }
      actions={
        <>
          <PaiementStatus
            commandeId={commande.commande.id}
            paiement={commande.commande.paiement}
            montantTotal={commande.commande.montantTotal}
            commandeClose={commande.statut === 'annulee' || commande.statut === 'refusee'}
          />
          <LivreurCard livreur={commande.commande.livreur} actif={actif} />
          {!actif && (
            <Button size="lg" className="w-full" disabled={recommandationEnCours} onClick={() => void recommander(commande)}>
              <RotateCcw aria-hidden="true" />
              {recommandationEnCours ? 'Préparation du panier...' : 'Recommander'}
            </Button>
          )}
          {commande.statut === 'en_attente_acceptation' && (
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
              Annuler la commande
            </Button>
          )}
        </>
      }
    >
      <NotationCard
        livree={commande.statut === 'livree'}
        cibles={[
          { cible: 'partenaire' as const, libelle: `Le restaurant ${commande.partenaire.nom}` },
          ...(commande.commande.livreur
            ? [{ cible: 'livreur' as const, libelle: `Votre livreur, ${commande.commande.livreur.user.nom}` }]
            : []),
        ]}
        notations={commande.commande.notations}
        enCours={noter.isPending}
        onNoter={(notes, callbacks) => noter.mutate({ commandeId: commande.commande.id, notes }, callbacks)}
      />

      <CarteDetail titre="Votre commande">
        <ul className="divide-y divide-border">
          {commande.lignes.map((ligne) => (
            <li key={ligne.id} className="flex items-start justify-between gap-3 py-2.5 text-sm first:pt-0">
              <span>
                <span className="font-semibold text-primary">{ligne.quantite} ×</span> {ligne.plat.nom}
                {ligne.instructions && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">« {ligne.instructions} »</span>
                )}
              </span>
              <span className="shrink-0">{formatPrixFcfa(Number(ligne.prixUnitaire) * ligne.quantite)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Plats</dt>
            <dd>{commande.commande.sousTotal ? formatPrixFcfa(commande.commande.sousTotal) : '—'}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>Livraison</dt>
            <dd>{commande.commande.fraisLivraison ? formatPrixFcfa(commande.commande.fraisLivraison) : '—'}</dd>
          </div>
          <div className="flex justify-between gap-3 text-muted-foreground">
            <dt>
              Frais de service ChapExpress
              <span className="block text-xs">15 % des plats + livraison</span>
            </dt>
            <dd className="shrink-0">{commande.commande.commission ? formatPrixFcfa(commande.commande.commission) : '—'}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-border pt-2 text-foreground">
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
