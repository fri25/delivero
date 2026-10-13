import { useState } from 'react';
import { Bike, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  useAccepterCommande,
  useMarquerEnPreparation,
  useMarquerPrete,
  useRefuserCommande,
} from '@/api/commandes';
import { formatPrixFcfa } from '@/lib/format';
import { anciennete, reference, STATUT_LABELS } from '@/lib/commandes';
import { cn } from '@/lib/utils';
import type { CommandeRepas } from '@/api/types';

const MOTIFS_RAPIDES = ['Plat en rupture', 'Trop de commandes', 'Fermeture imprévue'];

/**
 * One order as the kitchen reads it: short number, how long ago, the dishes
 * in big type, then the single next action. The order number is the one the
 * client and the livreur see.
 */
export function CommandeCard({ commande, maintenant }: { commande: CommandeRepas; maintenant: number }) {
  const [refusOuvert, setRefusOuvert] = useState(false);
  const [motif, setMotif] = useState('');

  const accepter = useAccepterCommande();
  const refuser = useRefuserCommande();
  const marquerEnPreparation = useMarquerEnPreparation();
  const marquerPrete = useMarquerPrete();

  const pending =
    accepter.isPending || refuser.isPending || marquerEnPreparation.isPending || marquerPrete.isPending;
  const aAccepter = commande.statut === 'en_attente_acceptation';
  const livreur = commande.commande.livreur?.user;
  const nbPlats = commande.lignes.reduce((total, ligne) => total + ligne.quantite, 0);
  const erreur = (error: Error) => toast.error(error.message);

  return (
    <li
      data-commande={commande.id}
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10',
        aAccepter && 'ring-2 ring-destructive',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2 border-b border-border px-4 py-2.5',
          aAccepter ? 'bg-destructive text-white' : 'bg-secondary/60',
        )}
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="font-mono text-base font-bold tracking-wide">N° {reference(commande)}</span>
          <span className={cn('truncate text-sm', aAccepter ? 'text-white/85' : 'text-muted-foreground')}>
            {anciennete(commande.createdAt, maintenant)}
          </span>
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
            aAccepter ? 'bg-white text-destructive' : 'bg-muted text-muted-foreground',
            commande.statut === 'prete' && 'bg-success text-white',
          )}
        >
          {STATUT_LABELS[commande.statut]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <ul className="space-y-1.5">
          {commande.lignes.map((ligne) => (
            <li key={ligne.id} className="text-base">
              <span className="font-bold tabular-nums">{ligne.quantite} ×</span>{' '}
              <span className="font-medium">{ligne.plat.nom}</span>
              {ligne.instructions && (
                <span className="mt-0.5 block rounded-md bg-amber-100 px-2 py-1 text-sm text-amber-900">
                  « {ligne.instructions} »
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between border-t border-border pt-2 text-sm">
          <span className="text-muted-foreground">
            {nbPlats} plat{nbPlats > 1 ? 's' : ''} · pour vous
          </span>
          <span className="text-base font-semibold tabular-nums">
            {commande.commande.sousTotal ? formatPrixFcfa(commande.commande.sousTotal) : '—'}
          </span>
        </div>

        {livreur && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <Bike className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">
                Livreur : <span className="font-medium">{livreur.nom}</span>
              </span>
            </span>
            <a
              href={`tel:${livreur.telephone}`}
              className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
            >
              <Phone className="size-4" aria-hidden="true" />
              Appeler
            </a>
          </div>
        )}

        {commande.statut === 'refusee' && commande.motifRefus && (
          <p className="text-sm text-destructive">Motif du refus : {commande.motifRefus}</p>
        )}

        <div className="mt-auto">
          {aAccepter && !refusOuvert && (
            <div className="flex gap-2">
              <Button
                size="lg"
                className="h-12 flex-1 bg-success text-base hover:bg-success/85"
                disabled={pending}
                onClick={() => {
                  accepter.mutate(commande.id, {
                    onSuccess: () => toast.success(`Commande N° ${reference(commande)} acceptée.`),
                    onError: erreur,
                  });
                }}
              >
                Accepter
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-5 text-base"
                disabled={pending}
                onClick={() => setRefusOuvert(true)}
              >
                Refuser
              </Button>
            </div>
          )}

          {aAccepter && refusOuvert && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Pourquoi refuser ? Le client verra ce motif.</p>
              <div className="flex flex-wrap gap-2">
                {MOTIFS_RAPIDES.map((rapide) => (
                  <button
                    key={rapide}
                    type="button"
                    onClick={() => setMotif(rapide)}
                    className={cn(
                      'rounded-full border border-border px-3 py-1.5 text-sm',
                      motif === rapide && 'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {rapide}
                  </button>
                ))}
              </div>
              <Textarea
                aria-label="Motif du refus"
                placeholder="Ou écrivez le motif"
                value={motif}
                onChange={(event) => setMotif(event.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="h-11 flex-1"
                  disabled={!motif.trim() || refuser.isPending}
                  onClick={() => {
                    refuser.mutate(
                      { id: commande.id, motif: motif.trim() },
                      { onSuccess: () => toast.success('Commande refusée.'), onError: erreur },
                    );
                  }}
                >
                  Confirmer le refus
                </Button>
                <Button variant="ghost" className="h-11" onClick={() => setRefusOuvert(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {commande.statut === 'confirmee' && (
            <Button
              size="lg"
              className="h-12 w-full text-base"
              disabled={pending}
              onClick={() => marquerEnPreparation.mutate(commande.id, { onError: erreur })}
            >
              Commencer la préparation
            </Button>
          )}

          {commande.statut === 'en_preparation' && (
            <Button
              size="lg"
              className="h-12 w-full bg-success text-base hover:bg-success/85"
              disabled={pending}
              onClick={() =>
                marquerPrete.mutate(commande.id, {
                  onSuccess: () => toast.success('Commande prête : les livreurs sont prévenus.'),
                  onError: erreur,
                })
              }
            >
              C’est prêt, appeler un livreur
            </Button>
          )}

          {commande.statut === 'prete' && (
            <p className="text-sm text-muted-foreground">
              {livreur ? 'Le livreur arrive : remettez-lui la commande.' : 'En attente d’un livreur.'}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
