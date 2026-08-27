import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTerminerAchats } from '@/api/commandes-emplettes';

// Récapitulatif texte obligatoire avant de clore les achats : substitut à la
// photo du ticket de caisse, aucun stockage de fichiers S3 intégré (voir
// docs/service-emplettes.md).
export function TerminerAchatsForm({ commandeId }: { commandeId: string }) {
  const [recapitulatif, setRecapitulatif] = useState('');
  const terminerAchats = useTerminerAchats();

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium">Tous les articles sont pointés</p>
      <Textarea
        placeholder="Récapitulatif des achats (prix négociés, écarts constatés...)"
        value={recapitulatif}
        onChange={(event) => setRecapitulatif(event.target.value)}
      />
      <Button
        className="w-full"
        disabled={!recapitulatif.trim() || terminerAchats.isPending}
        onClick={() => {
          terminerAchats.mutate(
            { id: commandeId, recapitulatifAchats: recapitulatif.trim() },
            { onError: (error) => toast.error(error.message) },
          );
        }}
      >
        Terminer les achats
      </Button>
    </div>
  );
}
