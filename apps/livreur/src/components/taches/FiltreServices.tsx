import { SERVICE_LABELS, type ServiceLivreur } from '@/lib/taches';
import { cn } from '@/lib/utils';

/** "Tous / Repas / Colis / …" pills, with the number of tasks per service. */
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
      {options.map((option) => {
        const actif = valeur === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={actif}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-semibold whitespace-nowrap',
              actif ? 'bg-foreground text-background' : 'bg-card text-foreground shadow-(--shadow-carte)',
            )}
          >
            {option.label}
            <span className={cn('tabular-nums', actif ? 'text-background/70' : 'text-muted-foreground')}>{option.n}</span>
          </button>
        );
      })}
    </div>
  );
}
