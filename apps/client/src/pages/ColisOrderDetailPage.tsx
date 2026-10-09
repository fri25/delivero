import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnnulerCommandeColis, useCommandeColis } from '@/api/commandes-colis';
import { ColisStatusStepper } from '@/components/orders/ColisStatusStepper';
import { CopyableValue } from '@/components/colis/CopyableValue';
import { formatPrixFcfa } from '@/lib/format';
import { AvisCommandeSection } from '@/components/orders/AvisCommandeSection';
import { LoadError } from '@/components/layout/LoadError';

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  especes: 'Espèces à la livraison',
  mobile_money: 'Mobile Money',
};

export function ColisOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: commande, isPending, isError, refetch } = useCommandeColis(id);
  const annuler = useAnnulerCommandeColis();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) return <LoadError message="Le suivi de ce colis n’a pas pu être chargé." onRetry={() => void refetch()} />;

  if (!commande) {
    return <p className="text-sm text-destructive">Commande introuvable.</p>;
  }

  const lienSuivi = `${window.location.origin}/colis/suivi/${commande.id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Colis pour {commande.destinataireNom}</h1>
          <p className="text-sm text-muted-foreground">
            Envoyé le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' }).format(new Date(commande.createdAt))}
          </p>
        </div>
        {commande.fragile && <Badge variant="outline">Fragile</Badge>}
      </div>

      <ColisStatusStepper statut={commande.statut} motif={commande.motif} />

      <div className="space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Adresse d'enlèvement</span>
          <span className="text-right">{commande.adresseEnlevement.pointDeRepere}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Livraison</span>
          <span className="text-right">{commande.pointDeRepereLivraison}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Taille</span>
          <span className="text-right capitalize">{commande.taille}</span>
        </div>
        {commande.valeurDeclaree && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Valeur déclarée</span>
            <span>{formatPrixFcfa(commande.valeurDeclaree)}</span>
          </div>
        )}
        {commande.montantContreRemboursement && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Contre-remboursement à encaisser</span>
            <span>{formatPrixFcfa(commande.montantContreRemboursement)}</span>
          </div>
        )}
        {commande.commande.paiement && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Frais de livraison</span>
            <span>{MODE_PAIEMENT_LABELS[commande.commande.paiement.mode] ?? commande.commande.paiement.mode}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 font-medium text-foreground">
          <span>Total</span>
          <span>{commande.commande.montantTotal ? formatPrixFcfa(commande.commande.montantTotal) : '—'}</span>
        </div>
      </div>

      {commande.statut === 'livre' && (
        <section className="space-y-3 rounded-2xl border border-primary/20 bg-secondary/50 p-4" aria-labelledby="preuve-livraison">
          <div>
            <h2 id="preuve-livraison" className="font-heading text-lg font-semibold">Preuve de remise</h2>
            <p className="text-sm text-muted-foreground">
              Remis le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' }).format(new Date(commande.updatedAt))}.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-card p-3"><p className="text-xs text-muted-foreground">Réceptionnaire</p><p className="mt-1 font-semibold">{commande.nomReceptionnaire || 'Nom non renseigné'}</p></div>
            {commande.codeOtp && <div className="rounded-xl bg-card p-3"><p className="text-xs text-muted-foreground">Code de remise vérifié</p><p className="mt-1 font-mono text-lg font-semibold tracking-[0.2em]">{commande.codeOtp}</p></div>}
          </div>
        </section>
      )}

      {commande.codeOtp && commande.statut !== 'livre' && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <p className="text-sm text-muted-foreground">
            Aucune notification automatique n'est envoyée au destinataire pour l'instant : transmettez-lui
            vous-même ce code, il devra le communiquer au livreur à la remise.
          </p>
          <CopyableValue label="Code de remise" value={commande.codeOtp} />
          <CopyableValue label="Lien de suivi à transmettre au destinataire" value={lienSuivi} />
        </div>
      )}

      <AvisCommandeSection commandeId={commande.id} prestationTerminee={commande.statut === 'livre'} />

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
