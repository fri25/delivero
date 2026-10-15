import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSuiviColisPublic } from '@/api/commandes-colis';
import { ColisStatusStepper } from '@/components/orders/ColisStatusStepper';
import { STATUT_COLIS_LABELS } from '@/lib/statut-colis';

/**
 * Suivi public par lien, sans compte (cahier des charges §6.2.2). N'affiche
 * que ce que renvoie l'endpoint public — aucun champ reconstruit ou deviné
 * côté client (pas de téléphone, d'adresse client ni de code de remise ici).
 */
export function ColisSuiviPage() {
  const { id } = useParams<{ id: string }>();
  const { data: colis, isPending, isError } = useSuiviColisPublic(id);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !colis) {
    return <p className="text-sm text-destructive">Ce colis est introuvable.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Suivi de votre colis</h1>
          <p className="text-sm text-muted-foreground">{STATUT_COLIS_LABELS[colis.statut]}</p>
          {colis.nature && (
            <p className="mt-1 text-xs text-muted-foreground">
              Nature : <span className="font-medium text-foreground">{colis.nature}</span>
            </p>
          )}
        </div>
        {colis.fragile && <Badge variant="outline">Fragile</Badge>}
      </div>

      <ColisStatusStepper statut={colis.statut} />

      {colis.photoEnlevementUrl && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold">Photo lors de la prise en charge</p>
          {colis.etatEnlevement && (
            <p className="text-xs text-muted-foreground">Constat : {colis.etatEnlevement}</p>
          )}
          <a href={colis.photoEnlevementUrl} target="_blank" rel="noreferrer" className="block">
            <img
              src={colis.photoEnlevementUrl}
              alt="Prise en charge du colis"
              className="max-h-56 rounded-lg object-cover ring-1 ring-border hover:opacity-90"
            />
            <span className="mt-1 block text-xs text-brand-blue hover:underline">
              Ouvrir la photo en plein format
            </span>
          </a>
        </div>
      )}

      {colis.statut === 'livre' && colis.photoPreuveUrl && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold">Preuve de livraison</p>
          <a href={colis.photoPreuveUrl} target="_blank" rel="noreferrer" className="block">
            <img
              src={colis.photoPreuveUrl}
              alt="Preuve de livraison"
              className="max-h-56 rounded-lg object-cover ring-1 ring-border hover:opacity-90"
            />
            <span className="mt-1 block text-xs text-brand-blue hover:underline">
              Ouvrir la photo en plein format
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
