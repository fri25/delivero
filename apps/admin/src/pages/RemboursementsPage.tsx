import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useRemboursements, useRembourser } from '@/api/incidents';
import { formatDateHeure, formatPrixFcfa } from '@/lib/format';
import type { Remboursement, TypeService } from '@/api/types';

const SERVICE_LABELS: Record<TypeService, string> = {
  repas: 'Repas',
  colis: 'Colis',
  emplettes: 'Emplettes',
  courses_express: 'Course en ville',
};

function client(remboursement: Remboursement) {
  const { commande } = remboursement;
  return {
    nom: commande.client?.nom ?? commande.clientNomInvite ?? 'Client invité',
    telephone: commande.client?.telephone ?? commande.clientTelephoneInvite ?? '—',
  };
}

/** Why the order was stopped: dispatcher cancellation, restaurant refusal, or client. */
function raison(remboursement: Remboursement): string {
  const { commande } = remboursement;
  if (commande.motifAnnulation) {
    return `Annulée par ${commande.annuleePar?.nom ?? 'le dispatch'} : ${commande.motifAnnulation}`;
  }
  if (commande.commandeRepas?.statut === 'refusee') {
    return `Refusée par ${commande.commandeRepas.partenaire.nom}${commande.commandeRepas.motifRefus ? ` : ${commande.commandeRepas.motifRefus}` : ''}`;
  }
  return 'Annulée par le client';
}

function CarteARembourser({ remboursement }: { remboursement: Remboursement }) {
  const paye = Number(remboursement.montant);
  const [montant, setMontant] = useState(String(paye));
  const [reference, setReference] = useState('');
  const [motif, setMotif] = useState('');
  const rembourser = useRembourser();
  const { nom, telephone } = client(remboursement);

  const valeur = Number(montant);
  const montantValide = montant !== '' && Number.isInteger(valeur) && valeur >= 0 && valeur <= paye;
  const partiel = montantValide && valeur < paye;
  const pret = montantValide && (valeur === 0 || reference.trim() !== '') && (!partiel || motif.trim() !== '');

  return (
    <li className="space-y-4 rounded-3xl border border-destructive/40 bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-heading font-bold text-base text-foreground">
            {nom} · <a className="text-primary hover:underline font-mono font-medium" href={`tel:${telephone}`}>{telephone}</a>
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {SERVICE_LABELS[remboursement.commande.typeService]} du {formatDateHeure(remboursement.commande.createdAt)}
            {remboursement.referenceTransaction && ` · paiement ${remboursement.referenceTransaction}`}
          </p>
          <div className="mt-1.5 inline-block rounded-xl bg-destructive/10 border border-destructive/20 px-2.5 py-1 text-xs font-semibold text-destructive">
            {raison(remboursement)}
          </div>
        </div>
        <div className="text-right rounded-2xl bg-muted/50 border border-border/60 p-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Montant perçu</p>
          <p className="font-heading text-xl font-bold text-foreground font-mono">{formatPrixFcfa(paye)}</p>
        </div>
      </div>

      <form
        className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          rembourser.mutate(
            {
              id: remboursement.id,
              montantRembourse: valeur,
              reference: reference.trim() || undefined,
              motif: motif.trim() || undefined,
            },
            {
              onSuccess: () =>
                toast.success(valeur > 0 ? 'Remboursement enregistré. Le client est prévenu.' : 'Dossier clos sans remboursement.'),
              onError: (error) => toast.error(error.message),
            },
          );
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor={`montant-${remboursement.id}`} className="text-xs font-semibold">Montant à reverser</Label>
          <Input
            id={`montant-${remboursement.id}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={paye}
            step={1}
            value={montant}
            onChange={(event) => setMontant(event.target.value)}
            className="rounded-xl font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reference-${remboursement.id}`} className="text-xs font-semibold">Référence transaction Mobile Money</Label>
          <Input
            id={`reference-${remboursement.id}`}
            placeholder={valeur === 0 ? 'Rien à envoyer' : 'ex. MP231013.1542.A12345'}
            disabled={valeur === 0}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            className="rounded-xl font-mono text-sm"
          />
        </div>
        <Button
          type="submit"
          disabled={!pret || rembourser.isPending}
          className="h-10 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white"
        >
          {rembourser.isPending ? 'Enregistrement…' : 'Valider le remboursement'}
        </Button>
        {partiel && (
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor={`motif-${remboursement.id}`} className="text-xs font-semibold text-destructive">
              Pourquoi rembourser {formatPrixFcfa(paye - valeur)} de moins ? (obligatoire)
            </Label>
            <Input
              id={`motif-${remboursement.id}`}
              placeholder="ex. Frais de livraison retenus : le livreur s’est déplacé"
              value={motif}
              onChange={(event) => setMotif(event.target.value)}
              className="rounded-xl text-sm"
            />
          </div>
        )}
      </form>
    </li>
  );
}

/**
 * F-ADM-06 / F-ADM-16 — Mobile Money payments of refused or cancelled
 * orders. No automatic FedaPay refund in V1: the dispatcher sends the money,
 * then records the amount and the transfer reference here.
 */
export function RemboursementsPage() {
  const { data, isPending, isError } = useRemboursements();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Gestion des remboursements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Commandes payées par Mobile Money puis annulées ou refusées. Envoyez le transfert puis saisissez la référence.
        </p>
      </div>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
          <p className="font-heading font-semibold text-base">Impossible de charger les remboursements</p>
        </div>
      ) : (
        <>
          {data.aRembourser.length === 0 ? (
            <div className="flex items-center gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm font-semibold text-emerald-800 shadow-xs">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>Aucun remboursement en attente. Toutes les transactions sont à jour.</span>
            </div>
          ) : (
            <section className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg text-foreground">
                  En attente ({data.aRembourser.length})
                </h2>
                <span className="font-mono text-sm font-bold text-destructive">
                  Total : {formatPrixFcfa(data.aRembourser.reduce((total, r) => total + Number(r.montant), 0))}
                </span>
              </div>
              <ul className="space-y-4">
                {data.aRembourser.map((remboursement) => (
                  <CarteARembourser key={remboursement.id} remboursement={remboursement} />
                ))}
              </ul>
            </section>
          )}

          {data.rembourses.length > 0 && (
            <section className="space-y-3.5 pt-2">
              <h2 className="font-heading font-bold text-lg text-foreground">Historique des remboursements traités</h2>
              <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-xs">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3 text-right">Payé</th>
                      <th className="px-4 py-3 text-right">Remboursé</th>
                      <th className="px-4 py-3">Référence / motif</th>
                      <th className="px-4 py-3">Traité par</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.rembourses.map((remboursement) => (
                      <tr key={remboursement.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-foreground">{client(remboursement).nom}</div>
                          <div className="text-xs text-muted-foreground">
                            {SERVICE_LABELS[remboursement.commande.typeService]}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs">{formatPrixFcfa(remboursement.montant)}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-emerald-600">
                          {formatPrixFcfa(remboursement.montantRembourse)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-xs font-medium text-foreground">{remboursement.referenceRemboursement ?? '—'}</div>
                          {remboursement.motifRemboursement && (
                            <div className="text-xs text-muted-foreground mt-0.5">{remboursement.motifRemboursement}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">
                          {remboursement.remboursePar?.nom ?? '—'}
                          {remboursement.rembourseAt && (
                            <div className="text-[11px]">{formatDateHeure(remboursement.rembourseAt)}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
