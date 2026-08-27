import { ExternalLink, Phone } from 'lucide-react';
import { formatPrixFcfa, googleMapsSearchUrl } from '@/lib/format';
import type { CommandeRepas } from '@/api/types';

export function CourseInfo({ commande }: { commande: CommandeRepas }) {
  const { adresse, client, paiement, montantTotal } = commande.commande;
  const pickupQuery = [commande.partenaire.nom, commande.partenaire.adresse].filter(Boolean).join(', ');
  const dropoffQuery = adresse?.libelle;

  return (
    <div className="space-y-2 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Récupération</p>
        <p className="font-medium">{commande.partenaire.nom}</p>
        {commande.partenaire.pointDeRepere && (
          <p className="text-muted-foreground">{commande.partenaire.pointDeRepere}</p>
        )}
        <a
          href={googleMapsSearchUrl(pickupQuery)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-brand-blue hover:underline"
        >
          Itinéraire <ExternalLink className="size-3" />
        </a>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Livraison</p>
        {adresse ? (
          <>
            <p className="font-medium">{adresse.pointDeRepere}</p>
            {dropoffQuery && (
              <a
                href={googleMapsSearchUrl(dropoffQuery)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand-blue hover:underline"
              >
                Itinéraire <ExternalLink className="size-3" />
              </a>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">—</p>
        )}
      </div>

      {client && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{client.nom}</span>
          <a href={`tel:${client.telephone}`} className="inline-flex items-center gap-1 text-brand-blue hover:underline">
            <Phone className="size-3.5" /> {client.telephone}
          </a>
        </div>
      )}

      {paiement?.mode === 'especes' && (
        <p className="rounded-md bg-muted/60 px-2 py-1.5 font-medium">
          À encaisser à la livraison : {montantTotal ? formatPrixFcfa(montantTotal) : '—'}
        </p>
      )}
    </div>
  );
}
