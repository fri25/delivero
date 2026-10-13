import { type ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_SUPPORT } from '@/lib/support';

/**
 * Shared frame of the order detail pages (Repas, Colis, Courses express).
 *
 * Mobile, top to bottom: status/timeline, then what the client can act on
 * (pay, call the livreur, reorder, cancel), then the details.
 * Desktop: timeline + details on the left, actions in a sticky right column.
 */
export function DetailCommandeLayout({
  service,
  titre,
  date,
  reference,
  suivi,
  actions,
  children,
}: {
  service: string;
  titre: string;
  date: string;
  /** Generic order id: its short form is what support asks for. */
  reference: string;
  suivi: ReactNode;
  actions: ReactNode;
  children: ReactNode;
}) {
  const dateLisible = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Porto-Novo',
  }).format(new Date(date));

  return (
    <div className="mx-auto max-w-2xl space-y-4 lg:max-w-6xl lg:space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">{service}</p>
        <h1 className="font-heading mt-0.5 text-2xl leading-tight font-semibold lg:text-3xl">{titre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dateLisible} · N° {reference.slice(-6).toUpperCase()}
        </p>
      </header>

      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:space-y-0">
        <div className="lg:col-start-1">{suivi}</div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          {actions}
          <a
            href={WHATSAPP_SUPPORT}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Un souci ? Écrivez-nous sur WhatsApp
          </a>
        </aside>

        <div className="space-y-4 lg:col-start-1">{children}</div>
      </div>
    </div>
  );
}
