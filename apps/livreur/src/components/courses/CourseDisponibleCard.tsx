import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CourseInfo } from './CourseInfo';
import { usePrendreEnCharge } from '@/api/commandes';
import type { CommandeRepas } from '@/api/types';

export function CourseDisponibleCard({ commande }: { commande: CommandeRepas }) {
  const prendreEnCharge = usePrendreEnCharge();

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <CourseInfo commande={commande} />
      <Button
        className="w-full"
        disabled={prendreEnCharge.isPending}
        onClick={() => {
          prendreEnCharge.mutate(commande.id, {
            onSuccess: () => toast.success('Course prise en charge.'),
            onError: (error) => toast.error(error.message),
          });
        }}
      >
        Prendre cette course
      </Button>
    </div>
  );
}
