import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CourseInfo } from './CourseInfo';
import { usePrendreEnCharge } from '@/api/commandes';
import type { CommandeRepas } from '@/api/types';

export function CourseDisponibleCard({ commande }: { commande: CommandeRepas }) {
  const prendreEnCharge = usePrendreEnCharge();

  return (
    <div className="space-y-3 p-4">
      <CourseInfo commande={commande} />
      <Button
        size="lg"
        className="w-full rounded-xl font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.99]"
        disabled={prendreEnCharge.isPending}
        onClick={() => {
          prendreEnCharge.mutate(commande.id, {
            onSuccess: () => toast.success('Course prise en charge.'),
            onError: (error) => toast.error(error.message),
          });
        }}
      >
        {prendreEnCharge.isPending ? 'Prise en charge...' : 'Prendre cette course'}
      </Button>
    </div>
  );
}
