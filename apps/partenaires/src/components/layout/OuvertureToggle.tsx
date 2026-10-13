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
        'gap-2 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white',
        ouvert && 'border-success bg-success hover:bg-success/85',
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
      <span className={cn('size-2 rounded-full', ouvert ? 'bg-white' : 'bg-white/50')} aria-hidden="true" />
      {ouvert ? 'Ouvert' : 'Fermé'}
    </Button>
  );
}
