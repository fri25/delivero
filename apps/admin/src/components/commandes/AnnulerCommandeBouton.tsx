import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { STATUTS_ANNULABLES, useAnnulerCommande } from '@/api/incidents';
import type { AdminCommandeRow } from '@/api/types';

const MOTIFS = ['Client injoignable', 'Restaurant fermé', 'Aucun livreur disponible', 'Demande du client'];

/**
 * F-ADM-06: cancel an order that has not started (decision of 13/10). The
 * reason is required: the client receives it, and a paid order moves to
 * « Remboursements ».
 */
export function AnnulerCommandeBouton({ row }: { row: AdminCommandeRow }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const [motif, setMotif] = useState('');
  const annuler = useAnnulerCommande();

  if (!row.statut || !STATUTS_ANNULABLES[row.typeService].includes(row.statut)) {
    return null;
  }

  const fermer = () => {
    dialogue.current?.close();
    setMotif('');
  };

  return (
    <>
      <Button
        size="xs"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => dialogue.current?.showModal()}
      >
        Annuler
      </Button>
      <dialog
        ref={dialogue}
        onClose={() => setMotif('')}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/40"
      >
        <form
          method="dialog"
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            annuler.mutate(
              { id: row.id, motif: motif.trim() },
              {
                onSuccess: () => {
                  toast.success(
                    row.paiement?.statut === 'reussi'
                      ? 'Commande annulée. Le paiement est à rembourser.'
                      : 'Commande annulée. Le client est prévenu.',
                  );
                  fermer();
                },
                onError: (error) => toast.error(error.message),
              },
            );
          }}
        >
          <div>
            <h2 className="font-heading text-lg font-semibold">Annuler cette commande ?</h2>
            <p className="text-sm text-muted-foreground">
              Le client reçoit le motif. S’il a payé, le paiement passe dans « Remboursements ».
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MOTIFS.map((rapide) => (
              <button
                key={rapide}
                type="button"
                onClick={() => setMotif(rapide)}
                className={
                  motif === rapide
                    ? 'rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground'
                    : 'rounded-full bg-secondary px-3 py-1.5 text-sm'
                }
              >
                {rapide}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`motif-${row.id}`}>Motif</Label>
            <textarea
              id={`motif-${row.id}`}
              required
              minLength={3}
              maxLength={300}
              value={motif}
              onChange={(event) => setMotif(event.target.value)}
              className="min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={fermer}>
              Retour
            </Button>
            <Button type="submit" variant="destructive" disabled={motif.trim().length < 3 || annuler.isPending}>
              {annuler.isPending ? 'Annulation…' : 'Annuler la commande'}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
