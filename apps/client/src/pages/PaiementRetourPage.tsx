import { useEffect } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { lienCommande, useSynchroniserPaiement } from '@/api/paiements';
import { STATUT_PAIEMENT_LABELS } from '@/lib/paiement';

// FedaPay redirects here after payment (/paiement/retour/:commandeId?id=&status=).
// The `status` query parameter is ignored on purpose: the API re-reads the
// transaction from FedaPay before telling the client anything.
export function PaiementRetourPage() {
  const { commandeId } = useParams<{ commandeId: string }>();
  const synchroniser = useSynchroniserPaiement();
  const { mutate } = synchroniser;

  useEffect(() => {
    if (commandeId) mutate(commandeId);
  }, [commandeId, mutate]);

  if (synchroniser.isError) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <XCircle className="mx-auto size-10 text-destructive" aria-hidden="true" />
        <p className="text-sm">{synchroniser.error.message}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => commandeId && mutate(commandeId)}>Vérifier à nouveau</Button>
          <Button asChild variant="outline">
            <Link to="/commandes">Mes commandes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const etat = synchroniser.data;
  if (!etat) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-8 animate-spin" aria-hidden="true" />
        Vérification du paiement...
      </div>
    );
  }

  const lien = lienCommande(etat.typeService, etat.commandeServiceId);
  const reussi = etat.statut === 'reussi';
  // Mobile Money confirmations can lag behind the redirect: the webhook will
  // update the order, and the detail page follows it in real time.
  const enAttente = etat.statut === 'en_attente';

  return (
    <div className="mx-auto max-w-sm space-y-4 text-center">
      {reussi ? (
        <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden="true" />
      ) : enAttente ? (
        <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground" aria-hidden="true" />
      ) : (
        <XCircle className="mx-auto size-10 text-destructive" aria-hidden="true" />
      )}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">
          {reussi
            ? 'Paiement reçu'
            : enAttente
              ? 'Paiement en cours de confirmation'
              : STATUT_PAIEMENT_LABELS[etat.statut]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {reussi
            ? 'Votre commande est transmise. Suivez-la en temps réel.'
            : enAttente
              ? 'Validez le paiement sur votre téléphone si ce n’est pas fait. Votre commande se mettra à jour automatiquement.'
              : 'Vous pouvez relancer le paiement depuis votre commande.'}
        </p>
      </div>
      <Button asChild className="w-full">
        <Link to={lien} replace>
          Voir ma commande
        </Link>
      </Button>
    </div>
  );
}
