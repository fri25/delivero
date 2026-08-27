import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArticlePointageRow } from './ArticlePointageRow';
import { EmplettesInfo } from './EmplettesInfo';
import { LitigeEmplettesForm } from './LitigeEmplettesForm';
import { TerminerAchatsForm } from './TerminerAchatsForm';
import { useMarquerEmplettesEnRoute, useMarquerEmplettesLivree } from '@/api/commandes-emplettes';
import { STATUT_EMPLETTES_LABELS } from '@/lib/statut-emplettes';
import type { CommandeEmplettes } from '@/api/types';

export function MonEmplettesCard({ commande }: { commande: CommandeEmplettes }) {
  const marquerEnRoute = useMarquerEmplettesEnRoute();
  const marquerLivree = useMarquerEmplettesLivree();

  const pointageBloque = commande.statut !== 'achats_en_cours';
  const tousArticlesPointes = commande.articles.every((article) => article.statut !== 'en_attente');
  const peutSignalerLitige = commande.statut === 'achats_en_cours';

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {new Date(commande.createdAt).toLocaleString('fr-FR')}
        </p>
        <Badge variant={commande.statut === 'livree' ? 'outline' : 'default'}>
          {STATUT_EMPLETTES_LABELS[commande.statut]}
        </Badge>
      </div>

      <EmplettesInfo commande={commande} />

      {commande.statut === 'validation_depassement' && (
        <p className="rounded-md bg-amber-500/10 px-2 py-1.5 text-sm text-amber-700">
          En attente de l'accord du client sur le dépassement de budget — vous ne pouvez pas
          continuer les achats pour le moment.
        </p>
      )}

      {(commande.statut === 'achats_en_cours' || commande.statut === 'validation_depassement') && (
        <div>
          {commande.articles.map((article) => (
            <ArticlePointageRow
              key={article.id}
              commandeId={commande.id}
              article={article}
              disabled={pointageBloque}
            />
          ))}
        </div>
      )}

      {commande.statut === 'achats_en_cours' && tousArticlesPointes && (
        <TerminerAchatsForm commandeId={commande.id} />
      )}

      {commande.statut === 'achats_termines' && (
        <>
          {commande.recapitulatifAchats && (
            <p className="rounded-md bg-muted/60 px-2 py-1.5 text-sm">
              {commande.recapitulatifAchats}
            </p>
          )}
          <Button
            className="w-full"
            disabled={marquerEnRoute.isPending}
            onClick={() => {
              marquerEnRoute.mutate(commande.id, {
                onError: (error) => toast.error(error.message),
              });
            }}
          >
            Marquer en route
          </Button>
        </>
      )}

      {commande.statut === 'en_route' && (
        <Button
          className="w-full"
          disabled={marquerLivree.isPending}
          onClick={() => {
            marquerLivree.mutate(commande.id, {
              onSuccess: () => toast.success('Commande livrée.'),
              onError: (error) => toast.error(error.message),
            });
          }}
        >
          Marquer livrée
        </Button>
      )}

      {commande.statut === 'litige' && commande.motif && (
        <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-sm text-destructive">
          {commande.motif}
        </p>
      )}

      {peutSignalerLitige && <LitigeEmplettesForm commandeId={commande.id} />}
    </div>
  );
}
