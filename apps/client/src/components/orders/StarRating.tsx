import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const LIBELLES = ['Très décevant', 'Décevant', 'Correct', 'Bien', 'Excellent'];

export function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (note: number) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((note) => (
        <button
          key={note}
          type="button"
          role="radio"
          aria-checked={value === note}
          aria-label={`${note} sur 5 — ${LIBELLES[note - 1]}`}
          onClick={() => onChange(note)}
          className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-secondary"
        >
          <Star
            className={cn('size-7', note <= value ? 'fill-primary text-primary' : 'text-muted-foreground')}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
