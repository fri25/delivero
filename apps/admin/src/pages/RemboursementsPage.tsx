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
    <li className="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {nom} · <a className="text-primary hover:underline" href={`tel:${telephone}`}>{telephone}</a>
          </p>
          <p className="text-sm text-muted-foreground">
            {SERVICE_LABELS[remboursement.commande.typeService]} du {formatDateHeure(remboursement.commande.createdAt)}
            {remboursement.referenceTransaction && ` · paiement ${remboursement.referenceTransaction}`}
          </p>
          <p className="mt-1 text-sm">{raison(remboursement)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Payé</p>
          <p className="font-heading text-xl font-semibold">{formatPrixFcfa(paye)}</p>
        </div>
      </div>

      <form
        className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
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
          <Label htmlFor={`montant-${remboursement.id}`}>Montant renvoyé</Label>
          <Input
            id={`montant-${remboursement.id}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={paye}
            step={1}
            value={montant}
            onChange={(event) => setMontant(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reference-${remboursement.id}`}>Référence de l’envoi Mobile Money</Label>
          <Input
            id={`reference-${remboursement.id}`}
            placeholder={valeur === 0 ? 'Rien à envoyer' : 'ex. MP231013.1542.A12345'}
            disabled={valeur === 0}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={!pret || rembourser.isPending}>
          {rembourser.isPending ? 'Enregistrement…' : 'Marquer remboursé'}
        </Button>
        {partiel && (
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor={`motif-${remboursement.id}`}>
              Pourquoi rembourser {formatPrixFcfa(paye - valeur)} de moins ? (obligatoire)
            </Label>
            <Input
              id={`motif-${remboursement.id}`}
              placeholder="ex. Frais de livraison retenus : le livreur s’est déplacé"
              value={motif}
              onChange={(event) => setMotif(event.target.value)}
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
        <h1 className="font-heading text-xl font-semibold">Remboursements</h1>
        <p className="text-sm text-muted-foreground">
          Commandes payées puis refusées ou annulées. Envoyez l’argent par Mobile Money, puis enregistrez-le ici.
        </p>
      </div>

      {isPending ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : isError ? (
        <p className="text-sm text-destructive">Impossible de charger les remboursements.</p>
      ) : (
        <>
          {data.aRembourser.length === 0 ? (
            <p className="flex items-center gap-2 rounded-2xl bg-success/10 p-4 text-sm font-medium text-success">
              <CheckCircle2 className="size-5" aria-hidden="true" />
              Aucun remboursement en attente.
            </p>
          ) : (
            <section className="space-y-3">
              <h2 className="font-heading font-semibold">
                À rembourser ({data.aRembourser.length}) ·{' '}
                {formatPrixFcfa(data.aRembourser.reduce((total, r) => total + Number(r.montant), 0))}
              </h2>
              <ul className="space-y-3">
                {data.aRembourser.map((remboursement) => (
                  <CarteARembourser key={remboursement.id} remboursement={remboursement} />
                ))}
              </ul>
            </section>
          )}

          {data.rembourses.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-heading font-semibold">Derniers remboursements</h2>
              <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Client</th>
                      <th className="px-3 py-2 text-right font-medium">Payé</th>
                      <th className="px-3 py-2 text-right font-medium">Remboursé</th>
                      <th className="px-3 py-2 font-medium">Référence / motif</th>
                      <th className="px-3 py-2 font-medium">Par</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rembourses.map((remboursement) => (
                      <tr key={remboursement.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <div>{client(remboursement).nom}</div>
                          <div className="text-xs text-muted-foreground">
                            {SERVICE_LABELS[remboursement.commande.typeService]}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatPrixFcfa(remboursement.montant)}</td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">
                          {formatPrixFcfa(remboursement.montantRembourse)}
                        </td>
                        <td className="px-3 py-2">
                          <div>{remboursement.referenceRemboursement ?? '—'}</div>
                          {remboursement.motifRemboursement && (
                            <div className="text-xs text-muted-foreground">{remboursement.motifRemboursement}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {remboursement.remboursePar?.nom ?? '—'}
                          {remboursement.rembourseAt && (
                            <div className="text-xs">{formatDateHeure(remboursement.rembourseAt)}</div>
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
