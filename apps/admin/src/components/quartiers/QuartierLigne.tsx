import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModifierQuartier } from '@/api/quartiers';
import type { Quartier } from '@/api/types';
import { formatPrixFcfa } from '@/lib/format';

/**
 * One neighbourhood. A price change applies to new orders only: existing
 * orders keep the amount computed when they were placed.
 */
export function QuartierLigne({ quartier }: { quartier: Quartier }) {
  const modifier = useModifierQuartier();
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(quartier.nom);
  const [frais, setFrais] = useState(String(Number(quartier.fraisLivraison)));

  const enregistrer = (dto: { nom?: string; fraisLivraison?: number; actif?: boolean }, message: string) =>
    modifier.mutate(
      { id: quartier.id, dto },
      {
        onSuccess: () => {
          toast.success(message);
          setEdition(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );

  if (edition) {
    return (
      <tr className="border-t border-border bg-muted/30">
        <td className="px-3 py-2">
          {quartier.autre ? (
            <span className="font-medium">{quartier.nom}</span>
          ) : (
            <Input className="h-7 w-44" value={nom} onChange={(e) => setNom(e.target.value)} aria-label="Nom" />
          )}
        </td>
        <td className="px-3 py-2">
          <Input
            type="number"
            min="0"
            step="50"
            className="h-7 w-28"
            value={frais}
            onChange={(e) => setFrais(e.target.value)}
            aria-label="Prix livraison (FCFA)"
          />
        </td>
        <td className="px-3 py-2" />
        <td className="px-3 py-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={modifier.isPending}
              onClick={() =>
                enregistrer(
                  { nom: quartier.autre ? undefined : nom.trim(), fraisLivraison: Number(frais) },
                  'Quartier mis à jour.',
                )
              }
            >
              Enregistrer
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEdition(false)}>
              Annuler
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 font-medium">
        {quartier.nom}
        {quartier.autre && (
          <span className="block text-xs font-normal text-muted-foreground">
            Quartiers hors liste (le client écrit le nom)
          </span>
        )}
      </td>
      <td className="px-3 py-2">{formatPrixFcfa(quartier.fraisLivraison)}</td>
      <td className="px-3 py-2">
        <Badge variant={quartier.actif ? 'secondary' : 'outline'}>{quartier.actif ? 'Proposé' : 'Masqué'}</Badge>
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEdition(true)}>
            Modifier
          </Button>
          {!quartier.autre && (
            <Button
              size="sm"
              variant="ghost"
              disabled={modifier.isPending}
              onClick={() =>
                enregistrer(
                  { actif: !quartier.actif },
                  quartier.actif ? `${quartier.nom} masqué aux clients.` : `${quartier.nom} de nouveau proposé.`,
                )
              }
            >
              {quartier.actif ? 'Masquer' : 'Réactiver'}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
