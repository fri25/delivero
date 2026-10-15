import { useZones } from '@/api/zones';

/** Zone picker shared by the livreur, restaurant, and order entry forms. */
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
      className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 shadow-xs transition-colors cursor-pointer"
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
