import { toast } from 'sonner';
import { useMoi, useToggleDisponibilite } from '@/api/livreur';
import { cn } from '@/lib/utils';

/** Available / unavailable switch (F-LIV-10): only available livreurs get courses. */
export function DisponibiliteToggle() {
  const { data: livreur } = useMoi();
  const toggleDisponibilite = useToggleDisponibilite();

  if (!livreur) {
    return null;
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={livreur.disponible}
      disabled={toggleDisponibilite.isPending}
      className={cn(
        'flex h-10 cursor-pointer items-center gap-2 rounded-full pr-3.5 pl-1.5 text-sm font-bold disabled:opacity-60',
        livreur.disponible ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
      )}
      onClick={() => {
        toggleDisponibilite.mutate(!livreur.disponible, {
          onSuccess: (data) => toast.success(data.disponible ? 'Vous êtes disponible.' : 'Vous êtes indisponible.'),
          onError: (error) => toast.error(error.message),
        });
      }}
    >
      {/* Switch knob: right and white when available. */}
      <span
        className={cn(
          'relative h-7 w-11 shrink-0 rounded-full transition-colors',
          livreur.disponible ? 'bg-white/25' : 'bg-foreground/15',
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'absolute top-1 size-5 rounded-full bg-white shadow-sm transition-[left]',
            livreur.disponible ? 'left-5' : 'left-1',
          )}
        />
      </span>
      {livreur.disponible ? 'Disponible' : 'Indisponible'}
    </button>
  );
}
