import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ColisInfo } from './ColisInfo';
import { LivraisonColisForm } from './LivraisonColisForm';
import { RecuperationColisForm } from './RecuperationColisForm';
import { LitigeColisForm } from './LitigeColisForm';
import { useMarquerColisEnRoute } from '@/api/commandes-colis';
import type { CommandeColis } from '@/api/types';

export function MonColisCard({ commande }: { commande: CommandeColis }) {
  const marquerEnRoute = useMarquerColisEnRoute();

  const peutSignalerLitige =
    commande.statut === 'colis_recupere' || commande.statut === 'en_route';

  return (
    <div className="space-y-3 p-4">

      <ColisInfo commande={commande} />

      {commande.statut === 'livreur_en_route_enlevement' && (
        <RecuperationColisForm commande={commande} />
      )}

      {commande.statut === 'colis_recupere' && (
        <Button
          size="lg"
          className="w-full rounded-xl font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.99]"
          disabled={marquerEnRoute.isPending}
          onClick={() => {
            marquerEnRoute.mutate(commande.id, {
              onError: (error) => toast.error(error.message),
            });
          }}
        >
          {marquerEnRoute.isPending ? 'En cours...' : 'Marquer en route'}
        </Button>
      )}

      {commande.statut === 'en_route' && <LivraisonColisForm commande={commande} />}

      {commande.statut === 'litige' && commande.motif && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-xs sm:text-sm font-semibold text-destructive">
          ⚠️ Motif du litige : {commande.motif}
        </div>
      )}

      {peutSignalerLitige && <LitigeColisForm commandeId={commande.id} />}
    </div>
  );
}
