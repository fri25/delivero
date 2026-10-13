import { PhotosCommande } from '@/components/medias/PhotosCommande';
import { contactClient } from '@/lib/contact-client';
import type { CommandeCoursesExpress } from '@/api/types';
import { ContactLigne } from '@/components/contact/ContactLigne';

export function CoursesExpressInfo({ commande }: { commande: CommandeCoursesExpress }) {
  const client = contactClient(commande.commande);

  return (
    <div className="space-y-2 text-sm">
      <p>{commande.description}</p>
      <PhotosCommande urls={commande.photoUrls} />

      {client && <ContactLigne nom={client.nom} telephone={client.telephone} />}
    </div>
  );
}
