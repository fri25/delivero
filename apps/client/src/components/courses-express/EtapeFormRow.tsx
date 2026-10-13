import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuartierField } from '@/components/adresses/QuartierField';
import type { ChoixQuartier } from '@/lib/quartiers';

export function EtapeFormRow({
  index,
  description,
  pointDeRepere,
  adresse,
  quartier,
  onQuartierChange,
  onDescriptionChange,
  onPointDeRepereChange,
  onAdresseChange,
  onRemove,
  canRemove,
}: {
  index: number;
  description: string;
  pointDeRepere: string;
  adresse: string;
  quartier: ChoixQuartier;
  onQuartierChange: (value: ChoixQuartier) => void;
  onDescriptionChange: (value: string) => void;
  onPointDeRepereChange: (value: string) => void;
  onAdresseChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const id = `etape-${index}`;
  return (
    <li className="space-y-3 rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {index + 1}
          </span>
          Arrêt {index + 1}
        </p>
        {canRemove && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Retirer l'arrêt ${index + 1}`} onClick={onRemove}>
            <X className="size-4" />
          </Button>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-action`}>Que faire ici ?</Label>
        <Input
          id={`${id}-action`}
          placeholder="Récupérer, déposer, payer..."
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          required
        />
      </div>
      <QuartierField id={`${id}-quartier`} value={quartier} onChange={onQuartierChange} afficherPrix={false} />
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-repere`}>Point de repère</Label>
        <Input
          id={`${id}-repere`}
          placeholder="Ex. Mairie, en face de la pharmacie"
          value={pointDeRepere}
          onChange={(event) => onPointDeRepereChange(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-adresse`}>
          Nom du lieu ou adresse <span className="font-normal text-muted-foreground">(facultatif)</span>
        </Label>
        <Input
          id={`${id}-adresse`}
          value={adresse}
          onChange={(event) => onAdresseChange(event.target.value)}
        />
      </div>
    </li>
  );
}
