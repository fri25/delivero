import { ExternalLink } from 'lucide-react';
import { PhotosCommande } from '@/components/medias/PhotosCommande';
import { formatPrixFcfa, googleMapsRouteUrl } from '@/lib/format';
import type { CommandeColis } from '@/api/types';
import { ContactLigne } from '@/components/contact/ContactLigne';

export function ColisInfo({ commande }: { commande: CommandeColis }) {
  const { adresseEnlevement, destinataireNom, destinataireTelephone, pointDeRepereLivraison, adresseLivraison } =
    commande;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {commande.fragile && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-500/30">
            ⚠️ Fragile
          </span>
        )}
        {commande.nature && (
          <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
            📦 {commande.nature}
          </span>
        )}
      </div>

      <PhotosCommande urls={commande.photoUrl ? [commande.photoUrl] : []} />

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-2xl bg-secondary/35 border border-border/50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">1. Enlèvement</p>
          <p className="font-heading font-bold text-foreground text-sm mt-0.5">{adresseEnlevement.libelle}</p>
          {adresseEnlevement.pointDeRepere && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{adresseEnlevement.pointDeRepere}</p>
          )}
          <a
            href={googleMapsRouteUrl(adresseEnlevement.pointDeRepere)}
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
          <p className="font-heading font-bold text-foreground text-sm mt-0.5 line-clamp-1">{pointDeRepereLivraison}</p>
          <a
            href={googleMapsRouteUrl(adresseLivraison)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mt-1.5"
          >
            <span>Itinéraire GPS</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      {destinataireNom && destinataireTelephone && (
        <div className="rounded-2xl bg-card border border-border/60 px-3.5 py-2">
          <ContactLigne nom={destinataireNom} telephone={destinataireTelephone} />
        </div>
      )}

      {(commande.etatEnlevement || commande.photoEnlevementUrl) && (
        <div className="rounded-2xl border border-border/70 bg-secondary/40 p-3 space-y-2">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Constat à l’enlèvement</p>
          {commande.etatEnlevement && (
            <p className="text-xs font-medium text-foreground/90">{commande.etatEnlevement}</p>
          )}
          {commande.photoEnlevementUrl && (
            <PhotosCommande urls={[commande.photoEnlevementUrl]} />
          )}
        </div>
      )}

      {commande.montantContreRemboursement && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
          <span>💵 Contre-remboursement à encaisser :</span>
          <span className="font-heading text-base font-extrabold text-amber-950 dark:text-amber-100">
            {formatPrixFcfa(commande.montantContreRemboursement)}
          </span>
        </div>
      )}
    </div>
  );
}
