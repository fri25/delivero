import { PhotosCommande } from '@/components/medias/PhotosCommande';
import { Phone } from 'lucide-react';
import { contactClient } from '@/lib/contact-client';
import type { CommandeCoursesExpress } from '@/api/types';

export function CoursesExpressInfo({ commande }: { commande: CommandeCoursesExpress }) {
  const client = contactClient(commande.commande);

  return (
    <div className="space-y-2 text-sm">
      <p>{commande.description}</p>
      <PhotosCommande urls={commande.photoUrls} />

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
