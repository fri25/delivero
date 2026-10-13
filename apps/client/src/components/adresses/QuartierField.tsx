import { useQuartiers } from '@/api/quartiers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrixFcfa } from '@/lib/format';
import type { ChoixQuartier } from '@/lib/quartiers';

/**
 * Mandatory neighbourhood picker (Q-28, 13/10): the neighbourhood sets the
 * delivery price, shown as soon as one is picked. "Autre quartier" asks for
 * the name. Native <select>: light on 3G, the phone's own picker on mobile.
 */
export function QuartierField({
  id,
  label = 'Quartier',
  value,
  onChange,
  afficherPrix = true,
}: {
  id: string;
  label?: string;
  value: ChoixQuartier;
  onChange: (value: ChoixQuartier) => void;
  afficherPrix?: boolean;
}) {
  const { data: quartiers, isPending, isError, refetch } = useQuartiers();
  const choisi = quartiers?.find((quartier) => quartier.id === value.quartierId);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value.quartierId}
        onChange={(event) => onChange({ ...value, quartierId: event.target.value })}
        required
        disabled={isPending}
        className="h-11 w-full rounded-full border border-input bg-transparent px-3 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:text-sm"
      >
        <option value="" disabled>
          {isPending ? 'Chargement des quartiers…' : 'Choisir le quartier'}
        </option>
        {quartiers?.map((quartier) => (
          <option key={quartier.id} value={quartier.id}>
            {quartier.nom}
          </option>
        ))}
      </select>
      {isError && (
        <button type="button" className="text-xs text-destructive underline" onClick={() => void refetch()}>
          La liste des quartiers n’a pas pu être chargée. Réessayer
        </button>
      )}

      {choisi?.autre && (
        <Input
          id={`${id}-precision`}
          aria-label="Nom du quartier"
          placeholder="Nom de votre quartier"
          value={value.precision}
          onChange={(event) => onChange({ ...value, precision: event.target.value })}
          required
          maxLength={100}
        />
      )}
      {afficherPrix && choisi && (
        <p className="text-xs text-muted-foreground">
          Livraison dans ce quartier : <span className="font-semibold text-foreground">{formatPrixFcfa(choisi.fraisLivraison)}</span>
        </p>
      )}
    </div>
  );
}
