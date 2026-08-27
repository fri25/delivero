import { ExternalLink, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatPrixFcfa, googleMapsSearchUrl } from '@/lib/format';
import type { CommandeColis } from '@/api/types';

export function ColisInfo({ commande }: { commande: CommandeColis }) {
  const { adresseEnlevement, destinataireNom, destinataireTelephone, pointDeRepereLivraison, adresseLivraison } =
    commande;

  return (
    <div className="space-y-2 text-sm">
      {commande.fragile && <Badge variant="outline">Fragile</Badge>}

      <div>
        <p className="text-xs font-medium text-muted-foreground">Enlèvement</p>
        <p className="font-medium">{adresseEnlevement.libelle}</p>
        <p className="text-muted-foreground">{adresseEnlevement.pointDeRepere}</p>
        <a
          href={googleMapsSearchUrl(adresseEnlevement.pointDeRepere)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-brand-blue hover:underline"
        >
          Itinéraire <ExternalLink className="size-3" />
        </a>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Livraison</p>
        <p className="font-medium">{pointDeRepereLivraison}</p>
        <a
          href={googleMapsSearchUrl(adresseLivraison)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-brand-blue hover:underline"
        >
          Itinéraire <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{destinataireNom}</span>
        <a
          href={`tel:${destinataireTelephone}`}
          className="inline-flex items-center gap-1 text-brand-blue hover:underline"
        >
          <Phone className="size-3.5" /> {destinataireTelephone}
        </a>
      </div>

      {commande.montantContreRemboursement && (
        <p className="rounded-md bg-muted/60 px-2 py-1.5 font-medium">
          Contre-remboursement à encaisser : {formatPrixFcfa(commande.montantContreRemboursement)}
        </p>
      )}
    </div>
  );
}
