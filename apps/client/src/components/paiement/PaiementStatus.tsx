import { Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useInitierPaiement } from '@/api/paiements';
import type { PaiementResume } from '@/api/types';
import { formatPrixFcfa } from '@/lib/format';
import { doitEtrePaye, STATUT_PAIEMENT_LABELS } from '@/lib/paiement';

export function PaiementStatus({
  commandeId,
  paiement,
  montantTotal,
  commandeClose,
  payer,
}: {
  /** Generic order id (`commande.commande.id`). */
  commandeId: string;
  paiement: PaiementResume | null;
  montantTotal: string | null;
  /** Order cancelled or refused: nothing left to pay. */
  commandeClose: boolean;
  /** Guest orders (F-CLI-02) pay through their tracking link instead. */
  payer?: { lancer: () => void; enCours: boolean };
}) {
  const initier = useInitierPaiement();

  if (!paiement) return null;

  if (!doitEtrePaye(paiement) || commandeClose) {
    return (
      <p className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
        <span className="text-muted-foreground">Paiement</span>
        <span className="font-medium">{STATUT_PAIEMENT_LABELS[paiement.statut]}</span>
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 ring-2 ring-primary sm:p-5">
      <div className="space-y-1">
        <p className="font-semibold">
          {paiement.statut === 'echoue' ? 'Le paiement n’a pas abouti' : 'Paiement en attente'}
        </p>
        <p className="text-sm text-muted-foreground">
          Votre commande sera transmise dès réception du paiement Mobile Money (MTN, Moov, Celtiis).
        </p>
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={payer ? payer.enCours : initier.isPending}
        onClick={() =>
          payer
            ? payer.lancer()
            : initier.mutate(commandeId, {
                onSuccess: (etat) => {
                  if (!etat.url) toast.success('Cette commande est déjà payée.');
                },
                onError: (error) => toast.error(error.message),
              })
        }
      >
        <Smartphone className="size-4" aria-hidden="true" />
        {(payer ? payer.enCours : initier.isPending)
          ? 'Ouverture du paiement...'
          : `Payer${montantTotal ? ` ${formatPrixFcfa(montantTotal)}` : ''} par Mobile Money`}
      </Button>
    </div>
  );
}
