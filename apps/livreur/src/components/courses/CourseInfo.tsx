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
        <div className="rounded-2xl bg-secondary/35 border border-border/50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">1. Récupération</p>
          <p className="font-heading font-bold text-foreground text-sm mt-0.5">{commande.partenaire.nom}</p>
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

        <div className="rounded-2xl bg-secondary/35 border border-border/50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">2. Livraison</p>
          {adresse ? (
            <>
              <p className="font-heading font-bold text-foreground text-sm mt-0.5 line-clamp-1">{adresse.pointDeRepere}</p>
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
        <div className="rounded-2xl bg-card border border-border/60 px-3.5 py-2">
          <ContactLigne nom={client.nom} telephone={client.telephone} />
        </div>
      )}

      {paiement?.mode === 'especes' && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
          <span>💵 À encaisser à la livraison :</span>
          <span className="font-heading text-base font-extrabold text-amber-950 dark:text-amber-100">
            {montantTotal ? formatPrixFcfa(montantTotal) : '—'}
          </span>
        </div>
      )}
    </div>
  );
}
