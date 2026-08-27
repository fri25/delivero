import { Skeleton } from '@/components/ui/skeleton';
import { CourseDisponibleCard } from '@/components/courses/CourseDisponibleCard';
import { useCoursesDisponibles } from '@/api/commandes';

export function CoursesDisponiblesPage() {
  const { data: commandes, isPending } = useCoursesDisponibles();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Courses disponibles</h1>

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
            <CourseDisponibleCard key={commande.id} commande={commande} />
          ))}
        </div>
      )}
    </div>
  );
}
