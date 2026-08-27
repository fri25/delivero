import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMesCommandesCoursesExpress } from '@/api/commandes-courses-express';
import { formatPrixFcfa } from '@/lib/format';
import { STATUT_COURSES_EXPRESS_LABELS } from '@/lib/statut-courses-express';

export function CoursesExpressOrdersPage() {
  const { data: commandes, isPending } = useMesCommandesCoursesExpress();

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mes courses</h1>
        <Button asChild size="sm">
          <Link to="/courses-express">Nouvelle demande</Link>
        </Button>
      </div>

      {!commandes || commandes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune course pour l'instant.</p>
      ) : (
        <div className="space-y-3">
          {commandes.map((commande) => (
            <Link
              key={commande.id}
              to={`/courses-express/commandes/${commande.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-brand-blue"
            >
              <div>
                <p className="line-clamp-1 font-medium">{commande.description}</p>
                <p className="text-sm text-muted-foreground">
                  {commande.commande.montantTotal ? formatPrixFcfa(commande.commande.montantTotal) : '—'}
                </p>
              </div>
              <Badge variant="outline">
                {STATUT_COURSES_EXPRESS_LABELS[commande.statut] ?? commande.statut}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
