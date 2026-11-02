import { toast } from 'sonner';
import { useMonRestaurant, useToggleOuverture } from '@/api/restaurant';
import { cn } from '@/lib/utils';

/** Open / closed in one tap (F-RES-06): closed restaurants are hidden from clients. */
export function OuvertureToggle() {
  const { data: restaurant } = useMonRestaurant();
  const toggleOuverture = useToggleOuverture();

  if (!restaurant) {
    return null;
  }

  const ouvert = restaurant.statutOuverture;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ouvert}
      disabled={toggleOuverture.isPending}
      className={cn(
        'flex h-10 cursor-pointer items-center gap-2 rounded-full pr-3.5 pl-1.5 text-sm font-bold disabled:opacity-60',
        ouvert ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
      )}
      onClick={() => {
        toggleOuverture.mutate(!ouvert, {
          onSuccess: (data) =>
            toast.success(
              data.statutOuverture ? 'Restaurant ouvert : les clients peuvent commander.' : 'Restaurant fermé aux commandes.',
            ),
          onError: (error) => toast.error(error.message),
        });
      }}
    >
      {/* Switch knob: right and white when open. */}
      <span
        className={cn('relative h-7 w-11 shrink-0 rounded-full transition-colors', ouvert ? 'bg-white/25' : 'bg-foreground/15')}
        aria-hidden="true"
      >
        <span className={cn('absolute top-1 size-5 rounded-full bg-white shadow-sm transition-[left]', ouvert ? 'left-5' : 'left-1')} />
      </span>
      {ouvert ? 'Ouvert' : 'Fermé'}
    </button>
  );
}
