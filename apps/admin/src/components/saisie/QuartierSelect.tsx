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
        className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 shadow-xs transition-colors cursor-pointer"
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
          placeholder="Précisez le nom du quartier..."
          className="rounded-xl"
          value={precision}
          onChange={(e) => onChange({ quartierId, precision: e.target.value })}
          required
        />
      )}
    </div>
  );
}
