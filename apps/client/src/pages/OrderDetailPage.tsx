import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnnulerCommande, useCommandeRepas } from '@/api/commandes-repas';
import { OrderStatusStepper } from '@/components/orders/OrderStatusStepper';
import { PaiementStatus } from '@/components/paiement/PaiementStatus';
import { LivreurCard } from '@/components/orders/LivreurCard';
import { NotationCard } from '@/components/orders/NotationCard';
import { useNoterCommande } from '@/api/notations';
import { RotateCcw } from 'lucide-react';
import { useRecommanderRepas } from '@/lib/recommander';
import { isStatutRepasActif } from '@/lib/statut-repas';
import { formatPrixFcfa } from '@/lib/format';
import { AvisCommandeSection } from '@/components/orders/AvisCommandeSection';
import { LoadError } from '@/components/layout/LoadError';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: commande, isPending, isError, refetch } = useCommandeRepas(id);
  const annuler = useAnnulerCommande();
  const noter = useNoterCommande(['commande-repas', id]);
  const { recommander, enCours: recommandationEnCours } = useRecommanderRepas();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) return <LoadError message="Le détail de la commande n’a pas pu être chargé." onRetry={() => void refetch()} />;

  if (!commande) {
    return <p className="text-sm text-destructive">Commande introuvable.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{commande.partenaire.nom}</h1>
        <p className="text-sm text-muted-foreground">
          Commande passée le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' }).format(new Date(commande.createdAt))}
        </p>
      </div>

      <OrderStatusStepper statut={commande.statut} motifRefus={commande.motifRefus} />

      <PaiementStatus
        commandeId={commande.commande.id}
        paiement={commande.commande.paiement}
        montantTotal={commande.commande.montantTotal}
        commandeClose={commande.statut === 'annulee' || commande.statut === 'refusee'}
      />

      <LivreurCard livreur={commande.commande.livreur} actif={isStatutRepasActif(commande.statut)} />

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

      <div>
        {commande.lignes.map((ligne) => (
          <div key={ligne.id} className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
            <span>
              {ligne.quantite} × {ligne.plat.nom}
            </span>
            <span>{formatPrixFcfa(Number(ligne.prixUnitaire) * ligne.quantite)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Sous-total plats</span>
          <span>{commande.commande.sousTotal ? formatPrixFcfa(commande.commande.sousTotal) : '—'}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Frais de livraison</span>
          <span>{commande.commande.fraisLivraison ? formatPrixFcfa(commande.commande.fraisLivraison) : '—'}</span>
        </div>
        <div className="flex items-start justify-between gap-3 text-muted-foreground">
          <span>
            Frais de service ChapExpress
            <span className="block text-xs">15 % des plats + livraison</span>
          </span>
          <span className="shrink-0">
            {commande.commande.commission ? formatPrixFcfa(commande.commande.commission) : '—'}
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2 text-foreground">
          <span className="font-semibold">À payer</span>
          <span className="font-heading text-2xl font-semibold">
            {commande.commande.montantTotal ? formatPrixFcfa(commande.commande.montantTotal) : '—'}
          </span>
        </div>
      </div>

      <AvisCommandeSection commandeId={commande.id} prestationTerminee={commande.statut === 'livree'} />

      {!isStatutRepasActif(commande.statut) && (
        <Button className="w-full" disabled={recommandationEnCours} onClick={() => void recommander(commande)}>
          <RotateCcw className="size-4" aria-hidden="true" />
          {recommandationEnCours ? 'Préparation du panier...' : 'Recommander'}
        </Button>
      )}

      {commande.statut === 'en_attente_acceptation' && (
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
