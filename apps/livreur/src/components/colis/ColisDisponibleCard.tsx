import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ColisInfo } from './ColisInfo';
import { usePrendreEnChargeColis } from '@/api/commandes-colis';
import { ApiError } from '@/api/client';
import type { CommandeColis } from '@/api/types';

export function ColisDisponibleCard({ commande }: { commande: CommandeColis }) {
  const prendreEnCharge = usePrendreEnChargeColis();

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <ColisInfo commande={commande} />
      <Button
        className="w-full"
        disabled={prendreEnCharge.isPending}
        onClick={() => {
          prendreEnCharge.mutate(commande.id, {
            onSuccess: () => toast.success('Colis pris en charge.'),
            onError: (error) => {
              // La liste est déjà rafraîchie par onSettled (voir
              // api/commandes-colis.ts) : ce colis va disparaître.
              if (error instanceof ApiError && error.statusCode === 409) {
                toast.error('Ce colis vient d’être pris en charge par un autre livreur.');
                return;
              }
              toast.error(error.message);
            },
          });
        }}
      >
        Prendre ce colis
      </Button>
    </div>
  );
}
