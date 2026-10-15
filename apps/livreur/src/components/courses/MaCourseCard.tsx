import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CourseInfo } from './CourseInfo';
import { useMarquerEnRoute, useMarquerLivree } from '@/api/commandes';
import type { CommandeRepas } from '@/api/types';

export function MaCourseCard({ commande }: { commande: CommandeRepas }) {
  const marquerEnRoute = useMarquerEnRoute();
  const marquerLivree = useMarquerLivree();

  return (
    <div className="space-y-3 p-4">

      <CourseInfo commande={commande} />

      {commande.statut === 'recuperee_par_livreur' && (
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

      {commande.statut === 'en_route' && (
        <Button
          size="lg"
          className="w-full rounded-xl font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.99]"
          disabled={marquerLivree.isPending}
          onClick={() => {
            marquerLivree.mutate(commande.id, {
              onSuccess: () => toast.success('Course livrée.'),
              onError: (error) => toast.error(error.message),
            });
          }}
        >
          {marquerLivree.isPending ? 'Confirmation...' : 'Marquer livrée'}
        </Button>
      )}
    </div>
  );
}
