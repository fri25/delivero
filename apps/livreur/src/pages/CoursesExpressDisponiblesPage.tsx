import { Skeleton } from '@/components/ui/skeleton';
import { CoursesExpressDisponibleCard } from '@/components/courses-express/CoursesExpressDisponibleCard';
import { useCoursesExpressDisponibles } from '@/api/commandes-courses-express';

export function CoursesExpressDisponiblesPage() {
  const { data: commandes, isPending } = useCoursesExpressDisponibles();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Courses express disponibles</h1>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : !commandes || commandes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune course disponible pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {commandes.map((commande) => (
            <CoursesExpressDisponibleCard key={commande.id} commande={commande} />
          ))}
        </div>
      )}
    </div>
  );
}
