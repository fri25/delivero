import { lienWhatsApp } from '@delivero/config/whatsapp';
import { MessageCircle, Phone } from 'lucide-react';

/**
 * A person the livreur may need to reach (client, recipient): call or
 * WhatsApp in one tap (F-CLI-26, decision of 13/10).
 */
export function ContactLigne({ nom, telephone }: { nom: string; telephone: string }) {
  const whatsapp = lienWhatsApp(telephone, 'Bonjour, ici votre livreur ChapExpress.');
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-1">
      <span className="font-semibold text-foreground text-sm">{nom}</span>
      <div className="flex items-center gap-2">
        <a
          href={`tel:${telephone}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition-all hover:bg-primary/20 active:scale-95"
        >
          <Phone className="size-3.5" aria-hidden="true" /> {telephone}
        </a>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#25D366]/15 px-3 text-xs font-bold text-[#128C7E] dark:text-[#25D366] transition-all hover:bg-[#25D366]/25 active:scale-95"
          >
            <MessageCircle className="size-3.5" aria-hidden="true" /> WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
