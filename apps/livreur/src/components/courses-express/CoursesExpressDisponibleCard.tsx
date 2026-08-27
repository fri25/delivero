import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CoursesExpressInfo } from './CoursesExpressInfo';
import { usePrendreEnChargeCoursesExpress } from '@/api/commandes-courses-express';
import { ApiError } from '@/api/client';
import type { CommandeCoursesExpress } from '@/api/types';

export function CoursesExpressDisponibleCard({ commande }: { commande: CommandeCoursesExpress }) {
  const prendreEnCharge = usePrendreEnChargeCoursesExpress();

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <CoursesExpressInfo commande={commande} />
      <p className="text-xs text-muted-foreground">
        {commande.etapes.length} étape{commande.etapes.length > 1 ? 's' : ''}
      </p>
      <Button
        className="w-full"
        disabled={prendreEnCharge.isPending}
        onClick={() => {
          prendreEnCharge.mutate(commande.id, {
            onSuccess: () => toast.success('Course prise en charge.'),
            onError: (error) => {
              // La liste est déjà rafraîchie par onSettled (voir
              // api/commandes-courses-express.ts) : cette course va disparaître.
              if (error instanceof ApiError && error.statusCode === 409) {
                toast.error('Cette course vient d’être prise en charge par un autre livreur.');
                return;
              }
              toast.error(error.message);
            },
          });
        }}
      >
        Prendre cette course
      </Button>
    </div>
  );
}
