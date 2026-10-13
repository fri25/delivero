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
    <div role="radiogroup" aria-label={name} className={cn('grid gap-2', colonnes === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
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
              'flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-2 py-2.5 text-center transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
              actif ? 'border-primary bg-secondary text-foreground' : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <span className={cn('text-sm', actif ? 'font-semibold' : 'font-medium')}>{option.label}</span>
            {option.detail && <span className="mt-0.5 text-xs leading-tight text-muted-foreground">{option.detail}</span>}
          </button>
        );
      })}
    </div>
  );
}
