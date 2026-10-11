import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSynchroniserPaiementInvite } from '@/api/invite';

// FedaPay return URL for a guest order (/suivi/:jeton/paiement?id=&status=).
// Like PaiementRetourPage, the query string is ignored: the API re-reads the
// transaction, then the tracking page shows the outcome.
export function PaiementRetourInvitePage() {
  const { jeton } = useParams<{ jeton: string }>();
  const synchroniser = useSynchroniserPaiementInvite(jeton);
  const { mutate } = synchroniser;

  useEffect(() => {
    if (jeton) mutate(undefined);
  }, [jeton, mutate]);

  useEffect(() => {
    if (synchroniser.data?.statut === 'reussi') toast.success('Paiement reçu, votre commande est transmise.');
    if (synchroniser.isError) toast.error(synchroniser.error.message);
  }, [synchroniser.data, synchroniser.isError, synchroniser.error]);

  if (synchroniser.isSuccess || synchroniser.isError) {
    return <Navigate to={`/suivi/${jeton}`} replace />;
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-8 animate-spin" aria-hidden="true" />
      Vérification du paiement...
    </div>
  );
}
