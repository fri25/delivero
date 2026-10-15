import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
    <Button
      size="sm"
      variant="outline"
      aria-pressed={ouvert}
      className={cn(
        'relative gap-2 rounded-full px-3.5 font-medium transition-all text-xs sm:text-sm h-8.5 sm:h-9 active:scale-95 shadow-xs',
        ouvert
          ? 'border-emerald-500/40 bg-emerald-600/90 hover:bg-emerald-600 text-white ring-1 ring-emerald-400/40'
          : 'border-white/20 bg-white/10 hover:bg-white/15 text-white/90',
      )}
      disabled={toggleOuverture.isPending}
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
      <span className="relative flex size-2 items-center justify-center">
        {ouvert && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        )}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full',
            ouvert ? 'bg-white' : 'bg-amber-400',
          )}
          aria-hidden="true"
        />
      </span>
      <span>{ouvert ? 'Ouvert' : 'Fermé'}</span>
    </Button>
  );
}
