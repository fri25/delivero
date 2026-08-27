import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CourseInfo } from './CourseInfo';
import { useMarquerEnRoute, useMarquerLivree } from '@/api/commandes';
import type { CommandeRepas, StatutRepas } from '@/api/types';

const STATUT_LABELS: Partial<Record<StatutRepas, string>> = {
  recuperee_par_livreur: 'Récupérée',
  en_route: 'En route',
  livree: 'Livrée',
};

export function MaCourseCard({ commande }: { commande: CommandeRepas }) {
  const marquerEnRoute = useMarquerEnRoute();
  const marquerLivree = useMarquerLivree();

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {new Date(commande.createdAt).toLocaleString('fr-FR')}
        </p>
        <Badge variant={commande.statut === 'livree' ? 'outline' : 'default'}>
          {STATUT_LABELS[commande.statut] ?? commande.statut}
        </Badge>
      </div>

      <CourseInfo commande={commande} />

      {commande.statut === 'recuperee_par_livreur' && (
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

      {commande.statut === 'en_route' && (
        <Button
          className="w-full"
          disabled={marquerLivree.isPending}
          onClick={() => {
            marquerLivree.mutate(commande.id, {
              onSuccess: () => toast.success('Course livrée.'),
              onError: (error) => toast.error(error.message),
            });
          }}
        >
          Marquer livrée
        </Button>
      )}
    </div>
  );
}
