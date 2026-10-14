import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STATUTS_ANNULABLES } from '@/api/incidents';
import { usePaiementRecu } from '@/api/saisie-manuelle';
import { formatPrixFcfa } from '@/lib/format';
import type { AdminCommandeRow } from '@/api/types';

const NON_PAYE = ['en_attente', 'echoue'];

/**
 * F-ADM-04 (decision of 13/10): an order entered by the dispatcher is paid by
 * Mobile Money sent straight to the ChapExpress number. Once the money is
 * there, the dispatcher enters the operator's reference and the order goes
 * out to the restaurant or the livreurs. Unpaid, it expires after 30 minutes.
 */
export function PaiementRecuBouton({ row }: { row: AdminCommandeRow }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const [reference, setReference] = useState('');
  const confirmer = usePaiementRecu();

  if (
    !row.saisieManuelle ||
    row.paiement?.mode !== 'mobile_money' ||
    !NON_PAYE.includes(row.paiement.statut) ||
    !row.statut ||
    !STATUTS_ANNULABLES[row.typeService].includes(row.statut)
  ) {
    return null;
  }

  const fermer = () => {
    dialogue.current?.close();
    setReference('');
  };

  return (
    <>
      <Button size="xs" variant="outline" onClick={() => dialogue.current?.showModal()}>
        Paiement reçu
      </Button>
      <dialog
        ref={dialogue}
        onClose={() => setReference('')}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/40"
      >
        <form
          method="dialog"
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            confirmer.mutate(
              { id: row.id, reference: reference.trim() },
              {
                onSuccess: () => {
                  toast.success('Paiement confirmé. La commande est transmise.');
                  fermer();
                },
                onError: (error) => toast.error(error.message),
              },
            );
          }}
        >
          <div>
            <h2 className="font-heading text-lg font-semibold">Confirmer le paiement</h2>
            <p className="text-sm text-muted-foreground">
              Vérifiez sur le téléphone ChapExpress que {formatPrixFcfa(row.montantTotal)} sont bien
              arrivés, puis saisissez la référence du SMS Mobile Money.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`reference-${row.id}`}>Référence de la transaction</Label>
            <Input
              id={`reference-${row.id}`}
              required
              minLength={3}
              maxLength={100}
              autoComplete="off"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={fermer}>
              Retour
            </Button>
            <Button type="submit" disabled={reference.trim().length < 3 || confirmer.isPending}>
              {confirmer.isPending ? 'Confirmation…' : 'Confirmer'}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

