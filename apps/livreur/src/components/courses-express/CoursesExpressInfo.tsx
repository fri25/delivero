import { Phone } from 'lucide-react';
import type { CommandeCoursesExpress } from '@/api/types';

export function CoursesExpressInfo({ commande }: { commande: CommandeCoursesExpress }) {
  const client = commande.commande.client;

  return (
    <div className="space-y-2 text-sm">
      <p>{commande.description}</p>

      {client && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{client.nom}</span>
          <a
            href={`tel:${client.telephone}`}
            className="inline-flex items-center gap-1 text-brand-blue hover:underline"
          >
            <Phone className="size-3.5" /> {client.telephone}
          </a>
        </div>
      )}
    </div>
  );
}
