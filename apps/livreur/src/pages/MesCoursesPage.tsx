import { Skeleton } from '@/components/ui/skeleton';
import { MaCourseCard } from '@/components/courses/MaCourseCard';
import { useMesCourses } from '@/api/commandes';

export function MesCoursesPage() {
  const { data: commandes, isPending } = useMesCourses();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!commandes || commandes.length === 0) {
    return (
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Mes courses</h1>
        <p className="text-sm text-muted-foreground">Aucune course prise en charge pour l'instant.</p>
      </div>
    );
  }

  const enCours = commandes.filter((commande) => commande.statut !== 'livree');
  const livrees = commandes.filter((commande) => commande.statut === 'livree');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Mes courses</h1>

      {enCours.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">En cours ({enCours.length})</h2>
          <div className="space-y-3">
            {enCours.map((commande) => (
              <MaCourseCard key={commande.id} commande={commande} />
            ))}
          </div>
        </div>
      )}

      {livrees.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Livrées</h2>
          <div className="space-y-3">
            {livrees.map((commande) => (
              <MaCourseCard key={commande.id} commande={commande} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
