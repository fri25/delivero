import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ColisInfo } from './ColisInfo';
import { LivraisonColisForm } from './LivraisonColisForm';
import { LitigeColisForm } from './LitigeColisForm';
import { useMarquerColisEnRoute, useMarquerColisRecupere } from '@/api/commandes-colis';
import type { CommandeColis } from '@/api/types';

export function MonColisCard({ commande }: { commande: CommandeColis }) {
  const marquerRecupere = useMarquerColisRecupere();
  const marquerEnRoute = useMarquerColisEnRoute();

  const peutSignalerLitige =
    commande.statut === 'colis_recupere' || commande.statut === 'en_route';

  return (
    <div className="space-y-3 p-4">

      <ColisInfo commande={commande} />

      {commande.statut === 'livreur_en_route_enlevement' && (
        <Button
          size="lg"
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
          size="lg"
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
