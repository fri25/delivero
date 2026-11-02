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
      {(commande.fragile || commande.nature) && (
        <div className="flex flex-wrap items-center gap-2">
          {commande.fragile && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
              Fragile
            </span>
          )}
          {commande.nature && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{commande.nature}</span>}
        </div>
      )}

      <PhotosCommande urls={commande.photoUrl ? [commande.photoUrl] : []} />

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl bg-muted p-3">
          <p className="text-xs font-semibold text-muted-foreground">1. Enlèvement</p>
          <p className="mt-0.5 text-base font-bold">{adresseEnlevement.libelle}</p>
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

        <div className="rounded-xl bg-muted p-3">
          <p className="text-xs font-semibold text-muted-foreground">2. Livraison</p>
          <p className="mt-0.5 line-clamp-1 text-base font-bold">{pointDeRepereLivraison}</p>
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
        <div className="rounded-xl border border-border px-3.5 py-2">
          <ContactLigne nom={destinataireNom} telephone={destinataireTelephone} />
        </div>
      )}

      {(commande.etatEnlevement || commande.photoEnlevementUrl) && (
        <div className="space-y-2 rounded-xl bg-muted p-3">
          <p className="text-sm font-bold">Constat à l’enlèvement</p>
          {commande.etatEnlevement && (
            <p className="text-xs font-medium text-foreground/90">{commande.etatEnlevement}</p>
          )}
          {commande.photoEnlevementUrl && (
            <PhotosCommande urls={[commande.photoEnlevementUrl]} />
          )}
        </div>
      )}

      {commande.montantContreRemboursement && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-100 p-3 text-sm font-bold text-amber-950 dark:bg-amber-500/15 dark:text-amber-100">
          <span>Contre-remboursement à encaisser :</span>
          <span className="text-lg font-extrabold tabular-nums">
            {formatPrixFcfa(commande.montantContreRemboursement)}
          </span>
        </div>
      )}
    </div>
  );
}
