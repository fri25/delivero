import { Bike, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LivreurContact } from '@/api/types';

/** F-CLI-26: who delivers, with a one-tap call (no in-app messaging yet). */
export function LivreurCard({ livreur, actif }: { livreur: LivreurContact | null; actif: boolean }) {
  if (!livreur) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Bike className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{actif ? 'Votre livreur' : 'Livré par'}</p>
          <p className="truncate font-medium">{livreur.user.nom}</p>
        </div>
      </div>
      {actif && (
        <Button asChild size="sm" variant="outline">
          <a href={`tel:${livreur.user.telephone}`}>
            <Phone className="size-4" aria-hidden="true" />
            Appeler
          </a>
        </Button>
      )}
    </div>
  );
}
