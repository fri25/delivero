import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAnnulerCommandeEmplettes,
  useCommandeEmplettes,
  useValiderDepassement,
} from '@/api/commandes-emplettes';
import { EmplettesStatusStepper } from '@/components/orders/EmplettesStatusStepper';
import { formatPrixFcfa } from '@/lib/format';
import type { ArticleEmplette, StatutArticleEmplette } from '@/api/types';

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  especes: 'Espèces à la livraison',
  mobile_money: 'Mobile Money',
};

const STATUT_ARTICLE_LABELS: Record<StatutArticleEmplette, string> = {
  en_attente: 'En attente',
  achete: 'Acheté',
  indisponible: 'Indisponible',
  remplace: 'Remplacé',
};

function ArticleRow({ article }: { article: ArticleEmplette }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
      <div>
        <p className="text-sm">{article.libelle}</p>
        {article.produitRemplacementLibelle && (
          <p className="text-xs text-muted-foreground">
            Remplacé par : {article.produitRemplacementLibelle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {article.prixReel && <span className="text-sm">{formatPrixFcfa(article.prixReel)}</span>}
        <Badge variant={article.statut === 'en_attente' ? 'outline' : 'default'}>
          {STATUT_ARTICLE_LABELS[article.statut]}
        </Badge>
      </div>
    </div>
  );
}

export function EmplettesOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: commande, isPending } = useCommandeEmplettes(id);
  const annuler = useAnnulerCommandeEmplettes();
  const validerDepassement = useValiderDepassement();

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
        <h1 className="text-xl font-semibold">
          {commande.lieuAchat ?? 'Emplettes'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Demandé le {new Date(commande.createdAt).toLocaleString('fr-FR')}
        </p>
      </div>

      <EmplettesStatusStepper statut={commande.statut} motif={commande.motif} />

      {commande.statut === 'validation_depassement' && (
        <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="font-medium">Le budget est dépassé</p>
          <p className="text-sm text-muted-foreground">
            Budget prévu : {formatPrixFcfa(commande.budgetMax)} — montant constaté :{' '}
            {commande.montantReel ? formatPrixFcfa(commande.montantReel) : '—'}. Le livreur attend
            votre accord pour continuer les achats.
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={validerDepassement.isPending}
              onClick={() => {
                validerDepassement.mutate(
                  { id: commande.id, accepter: true },
                  {
                    onSuccess: () => toast.success('Dépassement accepté, le livreur poursuit les achats.'),
                    onError: (error) => toast.error(error.message),
                  },
                );
              }}
            >
              Accepter le dépassement
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={validerDepassement.isPending}
              onClick={() => {
                validerDepassement.mutate(
                  { id: commande.id, accepter: false },
                  {
                    onSuccess: () => toast.success('Commande annulée.'),
                    onError: (error) => toast.error(error.message),
                  },
                );
              }}
            >
              Refuser (annuler)
            </Button>
          </div>
        </div>
      )}

      <div>
        {commande.articles.map((article) => (
          <ArticleRow key={article.id} article={article} />
        ))}
      </div>

      {commande.recapitulatifAchats && (
        <div className="rounded-lg border border-border p-3 text-sm">
          <p className="mb-1 font-medium">Récapitulatif du livreur</p>
          <p className="text-muted-foreground">{commande.recapitulatifAchats}</p>
        </div>
      )}

      <div className="space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Budget maximum</span>
          <span>{formatPrixFcfa(commande.budgetMax)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Montant réel des achats</span>
          <span>{commande.commande.sousTotal ? formatPrixFcfa(commande.commande.sousTotal) : '—'}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Frais de livraison</span>
          <span>
            {commande.commande.fraisLivraison ? formatPrixFcfa(commande.commande.fraisLivraison) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Frais de service</span>
          <span>{commande.commande.commission ? formatPrixFcfa(commande.commande.commission) : '—'}</span>
        </div>
        {commande.commande.paiement && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Paiement</span>
            <span>
              {MODE_PAIEMENT_LABELS[commande.commande.paiement.mode] ?? commande.commande.paiement.mode}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 font-medium text-foreground">
          <span>{commande.commande.sousTotal ? 'Total' : 'Total indicatif'}</span>
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
