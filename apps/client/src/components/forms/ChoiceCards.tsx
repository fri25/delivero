import { cn } from '@/lib/utils';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  detail?: string;
}

/**
 * Tappable cards instead of a dropdown: every option is visible at once, one
 * tap to pick. Radio semantics for screen readers.
 */
export function ChoiceCards<T extends string>({
  name,
  value,
  options,
  onChange,
  colonnes = 3,
}: {
  name: string;
  value: T;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
  colonnes?: 2 | 3;
}) {
  return (
    <div role="radiogroup" aria-label={name} className={cn('grid gap-2.5', colonnes === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
      {options.map((option) => {
        const actif = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-18 flex-col items-center justify-center rounded-2xl border-2 px-3 py-3 text-center transition-all duration-200 active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none cursor-pointer',
              actif
                ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30 font-semibold'
                : 'border-border/80 bg-card hover:border-primary/40 hover:bg-secondary/40 shadow-2xs',
            )}
          >
            <span className={cn('text-sm leading-snug', actif ? 'font-bold text-foreground' : 'font-medium text-foreground/80')}>
              {option.label}
            </span>
            {option.detail && (
              <span className={cn('mt-1 text-xs leading-tight', actif ? 'text-primary/90 font-medium' : 'text-muted-foreground')}>
                {option.detail}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
