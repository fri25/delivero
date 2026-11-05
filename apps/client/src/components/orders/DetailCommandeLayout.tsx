import { type ReactNode } from 'react';
import { useLienSupport } from '@/lib/support';

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
  const lienSupport = useLienSupport();
  const dateLisible = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Porto-Novo',
  }).format(new Date(date));

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:max-w-6xl">
      <header>
        <p className="mb-1 text-sm font-semibold text-muted-foreground">{service}</p>
        <h1 className="titre-page">{titre}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {dateLisible} · Commande <span className="font-mono font-semibold text-foreground">#{reference.slice(-6).toUpperCase()}</span>
        </p>
      </header>

      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 lg:space-y-0">
        <div className="lg:col-start-1">{suivi}</div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          {actions}
          <a
            href={lienSupport}
            target="_blank"
            rel="noreferrer"
            className="carte flex min-h-12 items-center justify-center px-4 text-sm font-bold text-[#1f9d55] hover:shadow-md"
          >
            Un souci ? Écrivez-nous sur WhatsApp
          </a>
        </aside>

        <div className="space-y-8 lg:col-start-1">{children}</div>
      </div>
    </div>
  );
}
