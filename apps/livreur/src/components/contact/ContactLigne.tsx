import { lienWhatsApp } from '@delivero/config/whatsapp';
import { MessageCircle, Phone } from 'lucide-react';

/**
 * A person the livreur may need to reach (client, recipient): call or
 * WhatsApp in one tap (F-CLI-26, decision of 13/10).
 */
export function ContactLigne({ nom, telephone }: { nom: string; telephone: string }) {
  const whatsapp = lienWhatsApp(telephone, 'Bonjour, ici votre livreur ChapExpress.');
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <span className="text-muted-foreground">{nom}</span>
      <span className="flex items-center gap-3">
        <a href={`tel:${telephone}`} className="inline-flex min-h-11 items-center gap-1 text-brand-blue hover:underline">
          <Phone className="size-3.5" aria-hidden="true" /> {telephone}
        </a>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1 text-brand-blue hover:underline"
          >
            <MessageCircle className="size-3.5" aria-hidden="true" /> WhatsApp
          </a>
        )}
      </span>
    </div>
  );
}
