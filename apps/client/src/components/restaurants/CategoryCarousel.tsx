import { type TypeCuisine, TYPES_CUISINE } from '@delivero/config/types-cuisine';
import { cn } from '@/lib/utils';

const CATEGORIES: Record<TypeCuisine, { emoji: string; label: string }> = {
  'Cuisine locale': { emoji: '🍲', label: 'Local' },
  Grillades: { emoji: '🍗', label: 'Grillades' },
  'Fast-food': { emoji: '🍟', label: 'Fast-food' },
  Pizza: { emoji: '🍕', label: 'Pizza' },
  'Sandwichs & chawarma': { emoji: '🌯', label: 'Sandwichs' },
  'Petit-déjeuner': { emoji: '🥐', label: 'Petit-déj' },
  'Café & boissons': { emoji: '🥤', label: 'Boissons' },
  Pâtisserie: { emoji: '🍰', label: 'Pâtisserie' },
};

/**
 * Cuisine picker: one uniform round badge per cuisine (light blue, solid
 * blue when active) — the food emoji carries the variety, not the colour.
 */
export function CategoryCarousel({
  activeCuisine,
  onSelectCuisine,
}: {
  activeCuisine: string | null;
  onSelectCuisine: (cuisine: TypeCuisine | null) => void;
}) {
  const options: { cle: TypeCuisine | null; emoji: string; label: string }[] = [
    { cle: null, emoji: '🍽️', label: 'Tout' },
    ...TYPES_CUISINE.map((cuisine) => ({ cle: cuisine, ...CATEGORIES[cuisine] })),
  ];

  return (
    <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pt-1 [scrollbar-width:none]">
      {options.map(({ cle, emoji, label }) => {
        const actif = activeCuisine === cle;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={actif}
            onClick={() => onSelectCuisine(actif && cle !== null ? null : cle)}
            className="group flex w-[4.25rem] shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-2xl py-1 active:scale-95"
          >
            <span
              className={cn(
                'flex size-13 items-center justify-center rounded-full text-2xl transition-colors duration-(--duration-fast)',
                actif ? 'bg-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'bg-secondary group-hover:bg-primary/15',
              )}
              aria-hidden="true"
            >
              {emoji}
            </span>
            <span
              className={cn(
                'max-w-full truncate text-[11px] leading-none',
                actif ? 'font-bold text-primary' : 'font-medium text-foreground/80',
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
