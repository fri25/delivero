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
    <div className="space-y-2.5 border-b border-border/60 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-primary animate-pulse" />
        <p className="text-xs sm:text-sm font-bold text-foreground">Le dispatch vous a attribué cette course.</p>
      </div>
      <Button
        size="lg"
        className="w-full rounded-xl font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.99]"
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate(tache.id, {
            onSuccess: () => toast.success('Course démarrée.'),
            onError: (error) => toast.error(error.message),
          })
        }
      >
        {mutation.isPending ? 'Démarrage...' : 'Démarrer cette course'}
      </Button>
    </div>
  );
}
