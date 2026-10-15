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
        'flex flex-col overflow-hidden rounded-3xl bg-card border border-border/70 shadow-xs transition-all hover:shadow-md',
        aAccepter && 'border-destructive/60 ring-2 ring-destructive/40 shadow-destructive/10',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3',
          aAccepter ? 'bg-destructive text-white' : 'bg-muted/40',
        )}
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="font-mono text-base font-bold tracking-tight">N° {reference(commande)}</span>
          <span className={cn('truncate text-xs font-medium', aAccepter ? 'text-white/80' : 'text-muted-foreground')}>
            {anciennete(commande.createdAt, maintenant)}
          </span>
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-xs font-bold shadow-2xs',
            aAccepter && 'bg-white text-destructive animate-pulse',
            !aAccepter && commande.statut === 'prete' && 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30',
            !aAccepter && commande.statut === 'en_preparation' && 'bg-amber-500/15 text-amber-700 border border-amber-500/30',
            !aAccepter && commande.statut === 'confirmee' && 'bg-brand-blue/15 text-brand-blue border border-brand-blue/30',
            !aAccepter && commande.statut === 'livree' && 'bg-muted text-muted-foreground',
          )}
        >
          {STATUT_LABELS[commande.statut]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-4 sm:p-5">
        <ul className="space-y-2">
          {commande.lignes.map((ligne) => (
            <li key={ligne.id} className="text-base">
              <div className="flex items-start gap-2">
                <span className="inline-flex items-center justify-center rounded-lg bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary tabular-nums shrink-0">
                  {ligne.quantite}×
                </span>
                <span className="font-semibold text-foreground leading-snug">{ligne.plat.nom}</span>
              </div>
              {ligne.instructions && (
                <div className="mt-1.5 ml-8 rounded-xl bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 text-xs font-medium text-amber-900">
                  « {ligne.instructions} »
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between border-t border-border/60 pt-3 text-sm">
          <span className="text-xs text-muted-foreground font-medium">
            {nbPlats} plat{nbPlats > 1 ? 's' : ''} · Sous-total restaurant
          </span>
          <span className="font-mono text-base font-bold tabular-nums text-foreground">
            {commande.commande.sousTotal ? formatPrixFcfa(commande.commande.sousTotal) : '—'}
          </span>
        </div>

        {livreur && (
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted/60 border border-border/50 px-3.5 py-2.5 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Bike className="size-4" aria-hidden="true" />
              </div>
              <span className="truncate text-xs sm:text-sm">
                Livreur : <span className="font-semibold text-foreground">{livreur.nom}</span>
              </span>
            </span>
            <a
              href={`tel:${livreur.telephone}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 px-3 py-1 text-xs font-bold text-primary transition-colors"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              Appeler
            </a>
          </div>
        )}

        {commande.statut === 'refusee' && commande.motifRefus && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium">
            Motif du refus : {commande.motifRefus}
          </div>
        )}

        <div className="mt-auto pt-2">
          {aAccepter && !refusOuvert && (
            <div className="flex gap-2">
              <Button
                size="lg"
                className="h-12 flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm active:scale-98 transition-all"
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
                className="h-12 px-5 rounded-2xl text-base font-semibold border-border hover:bg-destructive/10 hover:text-destructive active:scale-98 transition-all"
                disabled={pending}
                onClick={() => setRefusOuvert(true)}
              >
                Refuser
              </Button>
            </div>
          )}

          {aAccepter && refusOuvert && (
            <div className="space-y-2.5 rounded-2xl bg-muted/40 border border-border/60 p-3">
              <p className="text-xs font-semibold text-foreground">Pourquoi refuser ? Le client verra ce motif.</p>
              <div className="flex flex-wrap gap-1.5">
                {MOTIFS_RAPIDES.map((rapide) => (
                  <button
                    key={rapide}
                    type="button"
                    onClick={() => setMotif(rapide)}
                    className={cn(
                      'rounded-full border border-border/80 px-3 py-1 text-xs font-medium transition-all',
                      motif === rapide
                        ? 'border-primary bg-primary text-primary-foreground shadow-2xs font-semibold'
                        : 'bg-card text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {rapide}
                  </button>
                ))}
              </div>
              <Textarea
                aria-label="Motif du refus"
                placeholder="Ou écrivez le motif précis"
                className="rounded-xl bg-card text-sm"
                value={motif}
                onChange={(event) => setMotif(event.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="h-10 flex-1 rounded-xl font-bold"
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
                <Button variant="ghost" className="h-10 rounded-xl" onClick={() => setRefusOuvert(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {commande.statut === 'confirmee' && (
            <Button
              size="lg"
              className="h-12 w-full rounded-2xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-base shadow-sm active:scale-98 transition-all"
              disabled={pending}
              onClick={() => marquerEnPreparation.mutate(commande.id, { onError: erreur })}
            >
              Commencer la préparation
            </Button>
          )}

          {commande.statut === 'en_preparation' && (
            <Button
              size="lg"
              className="h-12 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm active:scale-98 transition-all"
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
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs sm:text-sm text-emerald-800 font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{livreur ? 'Le livreur arrive : remettez-lui la commande.' : 'En attente d’un livreur.'}</span>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
