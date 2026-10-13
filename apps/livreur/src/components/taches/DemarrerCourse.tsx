import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePrendreEnCharge } from '@/api/commandes';
import { usePrendreEnChargeColis } from '@/api/commandes-colis';
import { usePrendreEnChargeCoursesExpress } from '@/api/commandes-courses-express';
import { usePrendreEnChargeEmplettes } from '@/api/commandes-emplettes';
import type { Tache } from '@/api/taches';

/**
 * Course assigned by the dispatcher, not started yet: the livreur starts it
 * here (same API call as taking an available course).
 */
export function DemarrerCourse({ tache }: { tache: Tache }) {
  const repas = usePrendreEnCharge();
  const colis = usePrendreEnChargeColis();
  const express = usePrendreEnChargeCoursesExpress();
  const emplettes = usePrendreEnChargeEmplettes();
  const mutation = { repas, colis, courses_express: express, emplettes }[tache.service];

  return (
    <div className="space-y-2 border-b border-border bg-primary/5 p-4">
      <p className="text-sm font-medium">Le dispatch vous a attribué cette course.</p>
      <Button
        size="lg"
        className="w-full"
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate(tache.id, {
            onSuccess: () => toast.success('Course démarrée.'),
            onError: (error) => toast.error(error.message),
          })
        }
      >
        Démarrer cette course
      </Button>
    </div>
  );
}
