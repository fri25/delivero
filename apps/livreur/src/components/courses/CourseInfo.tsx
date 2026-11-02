import { contactClient } from '@/lib/contact-client';
import { ExternalLink } from 'lucide-react';
import { formatPrixFcfa, googleMapsRouteUrl } from '@/lib/format';
import type { CommandeRepas } from '@/api/types';
import { ContactLigne } from '@/components/contact/ContactLigne';

export function CourseInfo({ commande }: { commande: CommandeRepas }) {
  const { adresse, paiement, montantTotal } = commande.commande;
  const client = contactClient(commande.commande);
  const pickupQuery = [commande.partenaire.nom, commande.partenaire.adresse].filter(Boolean).join(', ');
  const dropoffQuery = adresse?.libelle;

  return (
    <div className="space-y-3 text-sm">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl bg-muted p-3">
          <p className="text-xs font-semibold text-muted-foreground">1. Récupération</p>
          <p className="mt-0.5 text-base font-bold">{commande.partenaire.nom}</p>
          {commande.partenaire.pointDeRepere && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{commande.partenaire.pointDeRepere}</p>
          )}
          <a
            href={googleMapsRouteUrl(pickupQuery)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mt-1.5"
          >
            <span>Itinéraire GPS</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        <div className="rounded-xl bg-muted p-3">
          <p className="text-xs font-semibold text-muted-foreground">2. Livraison</p>
          {adresse ? (
            <>
              <p className="mt-0.5 line-clamp-1 text-base font-bold">{adresse.pointDeRepere}</p>
              {dropoffQuery && (
                <a
                  href={googleMapsRouteUrl(dropoffQuery)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mt-1.5"
                >
                  <span>Itinéraire GPS</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">—</p>
          )}
        </div>
      </div>

      {client && (
        <div className="rounded-xl border border-border px-3.5 py-2">
          <ContactLigne nom={client.nom} telephone={client.telephone} />
        </div>
      )}

      {paiement?.mode === 'especes' && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-100 p-3 text-sm font-bold text-amber-950 dark:bg-amber-500/15 dark:text-amber-100">
          <span>À encaisser à la livraison :</span>
          <span className="text-lg font-extrabold tabular-nums">
            {montantTotal ? formatPrixFcfa(montantTotal) : '—'}
          </span>
        </div>
      )}
    </div>
  );
}
