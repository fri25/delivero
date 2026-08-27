import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDeclarerLitigeCoursesExpress } from '@/api/commandes-courses-express';

// Litige déclaré par le livreur lui-même, sans validation par un dispatcher
// (aucun back-office n'existe encore — voir docs/service-courses-express.md).
export function LitigeCoursesExpressForm({ commandeId }: { commandeId: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState('');
  const declarerLitige = useDeclarerLitigeCoursesExpress();

  if (!ouvert) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOuvert(true)}>
        Signaler un problème
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Boutique fermée, document introuvable, tâche irréalisable..."
        value={motif}
        onChange={(event) => setMotif(event.target.value)}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={!motif.trim() || declarerLitige.isPending}
          onClick={() => {
            declarerLitige.mutate(
              { id: commandeId, motif: motif.trim() },
              {
                onSuccess: () => toast.success('Problème signalé.'),
                onError: (error) => toast.error(error.message),
              },
            );
          }}
        >
          Confirmer le signalement
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOuvert(false)}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
