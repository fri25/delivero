import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnnulerCommande, useCommandeRepas } from '@/api/commandes-repas';
import { OrderStatusStepper } from '@/components/orders/OrderStatusStepper';
import { formatPrixFcfa } from '@/lib/format';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: commande, isPending } = useCommandeRepas(id);
  const annuler = useAnnulerCommande();

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
        <h1 className="text-xl font-semibold">{commande.partenaire.nom}</h1>
        <p className="text-sm text-muted-foreground">
          Commande passée le {new Date(commande.createdAt).toLocaleString('fr-FR')}
        </p>
      </div>

      <OrderStatusStepper statut={commande.statut} motifRefus={commande.motifRefus} />

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
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Frais de service ChapExpress (15 %)</span>
          <span>{commande.commande.commission ? formatPrixFcfa(commande.commande.commission) : '—'}</span>
        </div>
        <div className="flex items-center justify-between pt-1 font-medium text-foreground">
          <span>Total</span>
          <span>{commande.commande.montantTotal ? formatPrixFcfa(commande.commande.montantTotal) : '—'}</span>
        </div>
      </div>

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
