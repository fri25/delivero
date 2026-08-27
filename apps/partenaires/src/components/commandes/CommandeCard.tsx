import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  useAccepterCommande,
  useMarquerEnPreparation,
  useMarquerPrete,
  useRefuserCommande,
} from '@/api/commandes';
import { formatPrixFcfa } from '@/lib/format';
import type { CommandeRepas, StatutRepas } from '@/api/types';

const STATUT_LABELS: Record<StatutRepas, string> = {
  en_attente_acceptation: 'En attente',
  confirmee: 'Confirmée',
  refusee: 'Refusée',
  en_preparation: 'En préparation',
  prete: 'Prête',
  recuperee_par_livreur: 'Récupérée par le livreur',
  en_route: 'En route',
  livree: 'Livrée',
  annulee: 'Annulée',
};

export function CommandeCard({ commande }: { commande: CommandeRepas }) {
  const [refusOuvert, setRefusOuvert] = useState(false);
  const [motif, setMotif] = useState('');

  const accepter = useAccepterCommande();
  const refuser = useRefuserCommande();
  const marquerEnPreparation = useMarquerEnPreparation();
  const marquerPrete = useMarquerPrete();

  const pending =
    accepter.isPending || refuser.isPending || marquerEnPreparation.isPending || marquerPrete.isPending;

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {new Date(commande.createdAt).toLocaleString('fr-FR')}
        </p>
        <Badge variant={commande.statut === 'en_attente_acceptation' ? 'default' : 'outline'}>
          {STATUT_LABELS[commande.statut]}
        </Badge>
      </div>

      <ul className="space-y-1 text-sm">
        {commande.lignes.map((ligne) => (
          <li key={ligne.id}>
            <span className="font-medium">
              {ligne.quantite} × {ligne.plat.nom}
            </span>
            {ligne.instructions && (
              <span className="block text-muted-foreground">« {ligne.instructions} »</span>
            )}
          </li>
        ))}
      </ul>

      <div className="border-t border-border pt-2 text-sm">
        <div className="flex items-center justify-between font-medium">
          <span>Vos plats</span>
          <span>{commande.commande.sousTotal ? formatPrixFcfa(commande.commande.sousTotal) : '—'}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Total payé par le client (livraison et service ChapExpress inclus) :{' '}
          {commande.commande.montantTotal ? formatPrixFcfa(commande.commande.montantTotal) : '—'}
        </p>
      </div>

      {commande.statut === 'refusee' && commande.motifRefus && (
        <p className="text-sm text-destructive">Motif du refus : {commande.motifRefus}</p>
      )}

      {commande.statut === 'en_attente_acceptation' && !refusOuvert && (
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={pending}
            onClick={() => {
              accepter.mutate(commande.id, {
                onSuccess: () => toast.success('Commande acceptée.'),
                onError: (error) => toast.error(error.message),
              });
            }}
          >
            Accepter
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={pending}
            onClick={() => setRefusOuvert(true)}
          >
            Refuser
          </Button>
        </div>
      )}

      {commande.statut === 'en_attente_acceptation' && refusOuvert && (
        <div className="space-y-2">
          <Textarea
            placeholder="Motif du refus (ex. plat indisponible, fermeture imprévue...)"
            value={motif}
            onChange={(event) => setMotif(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!motif.trim() || refuser.isPending}
              onClick={() => {
                refuser.mutate(
                  { id: commande.id, motif: motif.trim() },
                  {
                    onSuccess: () => toast.success('Commande refusée.'),
                    onError: (error) => toast.error(error.message),
                  },
                );
              }}
            >
              Confirmer le refus
            </Button>
            <Button variant="ghost" onClick={() => setRefusOuvert(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {commande.statut === 'confirmee' && (
        <Button
          className="w-full"
          disabled={pending}
          onClick={() => {
            marquerEnPreparation.mutate(commande.id, {
              onError: (error) => toast.error(error.message),
            });
          }}
        >
          Marquer en préparation
        </Button>
      )}

      {commande.statut === 'en_preparation' && (
        <Button
          className="w-full"
          disabled={pending}
          onClick={() => {
            marquerPrete.mutate(commande.id, {
              onError: (error) => toast.error(error.message),
            });
          }}
        >
          Marquer prête pour le livreur
        </Button>
      )}
    </div>
  );
}
