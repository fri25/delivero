import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PreferenceRemplacement } from '@/api/types';

const PREFERENCE_LABELS: Record<PreferenceRemplacement, string> = {
  equivalent: 'Remplacer par équivalent',
  appeler: "M'appeler",
  ne_pas_acheter: 'Ne pas acheter',
};

export function ArticleFormRow({
  libelle,
  preference,
  onLibelleChange,
  onPreferenceChange,
  onRemove,
  canRemove,
}: {
  libelle: string;
  preference: PreferenceRemplacement;
  onLibelleChange: (value: string) => void;
  onPreferenceChange: (value: PreferenceRemplacement) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 space-y-1.5">
        <Input
          placeholder="Ex. 2 kg de tomates"
          value={libelle}
          onChange={(event) => onLibelleChange(event.target.value)}
          required
        />
        <Select
          value={preference}
          onValueChange={(value) => onPreferenceChange(value as PreferenceRemplacement)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(PREFERENCE_LABELS) as [PreferenceRemplacement, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="mt-0.5"
          aria-label="Retirer cet article"
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
