import { type TypeCuisine, TYPES_CUISINE } from '@delivero/config/types-cuisine';
import { cn } from '@/lib/utils';

const LABELS: Record<TypeCuisine, string> = {
  'Cuisine locale': 'Cuisine locale',
  Grillades: 'Grillades',
  'Fast-food': 'Fast-food',
  Pizza: 'Pizza',
  'Sandwichs & chawarma': 'Sandwichs',
  'Petit-déjeuner': 'Petit-déjeuner',
  'Café & boissons': 'Boissons',
  Pâtisserie: 'Pâtisserie',
};

/** Cuisine picker: a scrolling row of pills, the active one filled in ink. */
export function CategoryCarousel({
  activeCuisine,
  onSelectCuisine,
}: {
  activeCuisine: string | null;
  onSelectCuisine: (cuisine: TypeCuisine | null) => void;
}) {
  const options: { cle: TypeCuisine | null; label: string }[] = [
    { cle: null, label: 'Tout' },
    ...TYPES_CUISINE.map((cuisine) => ({ cle: cuisine, label: LABELS[cuisine] })),
  ];

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      {options.map(({ cle, label }) => {
        const actif = activeCuisine === cle;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={actif}
            onClick={() => onSelectCuisine(actif && cle !== null ? null : cle)}
            className={cn(
              'h-10 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold whitespace-nowrap',
              actif ? 'bg-foreground text-background' : 'bg-card text-foreground shadow-(--shadow-carte) hover:bg-accent',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
