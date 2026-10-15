import { useState } from 'react';
import { Pencil, Check, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModifierQuartier } from '@/api/quartiers';
import type { Quartier } from '@/api/types';
import { formatPrixFcfa } from '@/lib/format';
import { cn } from '@/lib/utils';

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
      <tr className="border-t border-border bg-primary/5 transition-colors">
        <td className="px-4 py-3">
          {quartier.autre ? (
            <span className="font-semibold text-foreground">{quartier.nom}</span>
          ) : (
            <Input
              className="h-8.5 rounded-lg max-w-[200px] text-sm font-medium"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              aria-label="Nom"
              autoFocus
            />
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min="0"
              step="50"
              className="h-8.5 w-28 rounded-lg font-mono font-bold text-sm"
              value={frais}
              onChange={(e) => setFrais(e.target.value)}
              aria-label="Prix livraison (FCFA)"
            />
            <span className="text-xs text-muted-foreground font-medium">FCFA</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <Badge
            variant={quartier.actif ? 'secondary' : 'outline'}
            className={cn(
              'font-semibold text-xs',
              quartier.actif
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'text-muted-foreground',
            )}
          >
            {quartier.actif ? 'Actif' : 'Masqué'}
          </Badge>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              className="h-8 rounded-lg font-bold gap-1 shadow-xs"
              disabled={modifier.isPending}
              onClick={() =>
                enregistrer(
                  { nom: quartier.autre ? undefined : nom.trim(), fraisLivraison: Number(frais) },
                  'Quartier mis à jour.',
                )
              }
            >
              {modifier.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Enregistrer
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              onClick={() => {
                setNom(quartier.nom);
                setFrais(String(Number(quartier.fraisLivraison)));
                setEdition(false);
              }}
            >
              <X className="size-3.5" />
              <span className="sr-only">Annuler</span>
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3.5 font-semibold text-foreground">
        <div className="flex flex-col">
          <span>{quartier.nom}</span>
          {quartier.autre && (
            <span className="text-[11px] font-normal text-muted-foreground">
              Quartiers hors liste (saisie libre du client)
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="font-mono font-bold text-sm text-foreground">
          {formatPrixFcfa(quartier.fraisLivraison)}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <Badge
          variant={quartier.actif ? 'secondary' : 'outline'}
          className={cn(
            'font-medium text-xs',
            quartier.actif
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              : 'text-muted-foreground border-border/80',
          )}
        >
          {quartier.actif ? 'Proposé aux clients' : 'Masqué'}
        </Badge>
      </td>
      <td className="px-4 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg font-medium text-xs gap-1 hover:border-primary/50"
            onClick={() => setEdition(true)}
          >
            <Pencil className="size-3 text-muted-foreground" />
            Modifier
          </Button>

          {!quartier.autre && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                'h-8 rounded-lg text-xs gap-1',
                quartier.actif
                  ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10',
              )}
              disabled={modifier.isPending}
              onClick={() =>
                enregistrer(
                  { actif: !quartier.actif },
                  quartier.actif ? `${quartier.nom} masqué aux clients.` : `${quartier.nom} de nouveau proposé.`,
                )
              }
            >
              {quartier.actif ? (
                <>
                  <EyeOff className="size-3" />
                  Masquer
                </>
              ) : (
                <>
                  <Eye className="size-3" />
                  Réactiver
                </>
              )}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
