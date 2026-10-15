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
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrer par service">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={valeur === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex min-h-9.5 shrink-0 items-center gap-2 rounded-full px-3.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer',
            valeur === option.value
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 border border-primary font-bold'
              : 'bg-card text-foreground/80 hover:bg-secondary hover:text-foreground border border-border/80 shadow-2xs',
          )}
        >
          <span>{option.label}</span>
          <span
            className={cn(
              'rounded-full px-1.5 py-0.2 text-[11px] font-bold',
              valeur === option.value ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground',
            )}
          >
            {option.n}
          </span>
        </button>
      ))}
    </div>
  );
}
