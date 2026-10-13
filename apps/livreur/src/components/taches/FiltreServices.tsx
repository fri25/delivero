import { SERVICE_LABELS, type ServiceLivreur } from '@/lib/taches';
import { cn } from '@/lib/utils';

/** "Tous / Repas / Colis / …" chips, with the number of tasks per service. */
export function FiltreServices({
  services,
  comptes,
  valeur,
  onChange,
}: {
  services: ServiceLivreur[];
  comptes: Partial<Record<ServiceLivreur, number>>;
  valeur: ServiceLivreur | 'tous';
  onChange: (valeur: ServiceLivreur | 'tous') => void;
}) {
  const total = Object.values(comptes).reduce((somme, n) => somme + (n ?? 0), 0);
  const options: { value: ServiceLivreur | 'tous'; label: string; n: number }[] = [
    { value: 'tous', label: 'Tous', n: total },
    ...services.map((service) => ({ value: service, label: SERVICE_LABELS[service], n: comptes[service] ?? 0 })),
  ];
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]" role="group" aria-label="Filtrer par service">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={valeur === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors',
            valeur === option.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/10',
          )}
        >
          {option.label}
          <span className={cn('text-xs', valeur === option.value ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
            {option.n}
          </span>
        </button>
      ))}
    </div>
  );
}
