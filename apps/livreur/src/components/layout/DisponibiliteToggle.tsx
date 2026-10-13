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
      variant={livreur.disponible ? 'default' : 'outline'}
      className={livreur.disponible ? 'bg-success hover:bg-success/85' : ''}
      disabled={toggleDisponibilite.isPending}
      onClick={() => {
        toggleDisponibilite.mutate(!livreur.disponible, {
          onSuccess: (data) =>
            toast.success(data.disponible ? 'Vous êtes disponible.' : 'Vous êtes indisponible.'),
          onError: (error) => toast.error(error.message),
        });
      }}
    >
      {livreur.disponible ? 'Disponible' : 'Indisponible'}
    </Button>
  );
}
