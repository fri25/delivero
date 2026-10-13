import { useZones } from '@/api/zones';

/** Zone picker shared by the livreur and restaurant forms. */
export function ZoneSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const { data: zones } = useZones();
  return (
    <select
      id={id}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    >
      <option value="" disabled>
        Choisir une zone
      </option>
      {zones?.map((zone) => (
        <option key={zone.id} value={zone.id}>
          {zone.nom}
        </option>
      ))}
    </select>
  );
}
