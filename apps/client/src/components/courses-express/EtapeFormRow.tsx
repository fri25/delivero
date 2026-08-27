import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function EtapeFormRow({
  index,
  description,
  pointDeRepere,
  adresse,
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
  onDescriptionChange: (value: string) => void;
  onPointDeRepereChange: (value: string) => void;
  onAdresseChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border p-3">
      <div className="flex-1 space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Étape {index + 1}</p>
        <Input
          placeholder="Quoi faire ici (récupérer, déposer...)"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          required
        />
        <Input
          placeholder="Point de repère (obligatoire)"
          value={pointDeRepere}
          onChange={(event) => onPointDeRepereChange(event.target.value)}
          required
        />
        <Input
          placeholder="Adresse ou nom du lieu (facultatif)"
          value={adresse}
          onChange={(event) => onAdresseChange(event.target.value)}
        />
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="mt-0.5"
          aria-label="Retirer cette étape"
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
