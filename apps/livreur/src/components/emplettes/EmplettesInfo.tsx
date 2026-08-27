import { ExternalLink, Phone } from 'lucide-react';
import { formatPrixFcfa, googleMapsSearchUrl } from '@/lib/format';
import type { CommandeEmplettes } from '@/api/types';

export function EmplettesInfo({ commande }: { commande: CommandeEmplettes }) {
  const { commande: commandeGenerique } = commande;
  const adresse = commandeGenerique.adresse;

  return (
    <div className="space-y-2 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Lieu d'achat</p>
        <p className="font-medium">{commande.lieuAchat ?? 'Au choix du livreur'}</p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">Livraison</p>
        {adresse ? (
          <>
            <p className="font-medium">{adresse.pointDeRepere}</p>
            <a
              href={googleMapsSearchUrl(adresse.pointDeRepere)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-blue hover:underline"
            >
              Itinéraire <ExternalLink className="size-3" />
            </a>
          </>
        ) : (
          <p className="text-muted-foreground">—</p>
        )}
      </div>

      {commandeGenerique.client && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{commandeGenerique.client.nom}</span>
          <a
            href={`tel:${commandeGenerique.client.telephone}`}
            className="inline-flex items-center gap-1 text-brand-blue hover:underline"
          >
            <Phone className="size-3.5" /> {commandeGenerique.client.telephone}
          </a>
        </div>
      )}

      <p className="rounded-md bg-muted/60 px-2 py-1.5 font-medium">
        Budget maximum : {formatPrixFcfa(commande.budgetMax)}
        {commande.montantReel && ` · Réel constaté : ${formatPrixFcfa(commande.montantReel)}`}
      </p>
    </div>
  );
}
