import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmplettesInfo } from './EmplettesInfo';
import { usePrendreEnChargeEmplettes } from '@/api/commandes-emplettes';
import { ApiError } from '@/api/client';
import type { CommandeEmplettes } from '@/api/types';

export function EmplettesDisponibleCard({ commande }: { commande: CommandeEmplettes }) {
  const prendreEnCharge = usePrendreEnChargeEmplettes();

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <EmplettesInfo commande={commande} />
      <Button
        className="w-full"
        disabled={prendreEnCharge.isPending}
        onClick={() => {
          prendreEnCharge.mutate(commande.id, {
            onSuccess: () => toast.success('Commande prise en charge.'),
            onError: (error) => {
              // La liste est déjà rafraîchie par onSettled (voir
              // api/commandes-emplettes.ts) : cette commande va disparaître.
              if (error instanceof ApiError && error.statusCode === 409) {
                toast.error('Cette commande vient d’être prise en charge par un autre livreur.');
                return;
              }
              toast.error(error.message);
            },
          });
        }}
      >
        Prendre cette commande
      </Button>
    </div>
  );
}
