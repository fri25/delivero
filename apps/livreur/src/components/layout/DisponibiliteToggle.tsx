import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useMoi, useToggleDisponibilite } from '@/api/livreur';

/** Available / unavailable switch (F-LIV-10): only available livreurs get courses. */
export function DisponibiliteToggle() {
  const { data: livreur } = useMoi();
  const toggleDisponibilite = useToggleDisponibilite();

  if (!livreur) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={toggleDisponibilite.isPending}
      className={
        livreur.disponible
          ? 'h-9 rounded-full bg-emerald-500/90 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 shadow-sm shadow-emerald-500/30 gap-1.5 transition-all active:scale-95'
          : 'h-9 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white/80 border border-white/20 font-semibold text-xs px-3.5 gap-1.5 transition-all active:scale-95'
      }
      onClick={() => {
        toggleDisponibilite.mutate(!livreur.disponible, {
          onSuccess: (data) =>
            toast.success(data.disponible ? 'Vous êtes disponible.' : 'Vous êtes indisponible.'),
          onError: (error) => toast.error(error.message),
        });
      }}
    >
      <span
        className={
          livreur.disponible
            ? 'size-2 rounded-full bg-white animate-pulse'
            : 'size-2 rounded-full bg-white/40'
        }
      />
      <span>{livreur.disponible ? 'Disponible' : 'Indisponible'}</span>
    </Button>
  );
}
