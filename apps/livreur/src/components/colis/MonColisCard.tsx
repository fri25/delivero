import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColisInfo } from './ColisInfo';
import { LivraisonColisForm } from './LivraisonColisForm';
import { LitigeColisForm } from './LitigeColisForm';
import { useMarquerColisEnRoute, useMarquerColisRecupere } from '@/api/commandes-colis';
import { STATUT_COLIS_LABELS } from '@/lib/statut-colis';
import type { CommandeColis } from '@/api/types';

export function MonColisCard({ commande }: { commande: CommandeColis }) {
  const marquerRecupere = useMarquerColisRecupere();
  const marquerEnRoute = useMarquerColisEnRoute();

  const peutSignalerLitige =
    commande.statut === 'colis_recupere' || commande.statut === 'en_route';

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {new Date(commande.createdAt).toLocaleString('fr-FR')}
        </p>
        <Badge variant={commande.statut === 'livre' ? 'outline' : 'default'}>
          {STATUT_COLIS_LABELS[commande.statut]}
        </Badge>
      </div>

      <ColisInfo commande={commande} />

      {commande.statut === 'livreur_en_route_enlevement' && (
        <Button
          className="w-full"
          disabled={marquerRecupere.isPending}
          onClick={() => {
            marquerRecupere.mutate(commande.id, {
              onError: (error) => toast.error(error.message),
            });
          }}
        >
          Colis récupéré
        </Button>
      )}

      {commande.statut === 'colis_recupere' && (
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
      )}

      {commande.statut === 'en_route' && <LivraisonColisForm commande={commande} />}

      {commande.statut === 'litige' && commande.motif && (
        <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-sm text-destructive">{commande.motif}</p>
      )}

      {peutSignalerLitige && <LitigeColisForm commandeId={commande.id} />}
    </div>
  );
}
