import { useQuartiers } from '@/api/quartiers';
import { Input } from '@/components/ui/input';
import { formatPrixFcfa } from '@/lib/format';

/**
 * Neighbourhood of a manually entered order (Q-28): it sets the price, so it
 * is mandatory, with the typed name when "Autre quartier" is picked.
 */
export function QuartierSelect({
  id,
  quartierId,
  precision,
  onChange,
}: {
  id: string;
  quartierId: string;
  precision: string;
  onChange: (value: { quartierId: string; precision: string }) => void;
}) {
  const { data: quartiers } = useQuartiers();
  const actifs = quartiers?.filter((quartier) => quartier.actif);
  const choisi = actifs?.find((quartier) => quartier.id === quartierId);

  return (
    <div className="space-y-1.5">
      <select
        id={id}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={quartierId}
        onChange={(e) => onChange({ quartierId: e.target.value, precision })}
        required
      >
        <option value="" disabled>
          Choisir le quartier
        </option>
        {actifs?.map((quartier) => (
          <option key={quartier.id} value={quartier.id}>
            {quartier.nom} — {formatPrixFcfa(quartier.fraisLivraison)}
          </option>
        ))}
      </select>
      {choisi?.autre && (
        <Input
          aria-label="Nom du quartier"
          placeholder="Nom du quartier"
          value={precision}
          onChange={(e) => onChange({ quartierId, precision: e.target.value })}
          required
        />
      )}
    </div>
  );
}
