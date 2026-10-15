import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CopyableValue } from '@/components/colis/CopyableValue';
import { ColisStatusStepper } from '@/components/orders/ColisStatusStepper';
import { CoursesExpressStatusStepper } from '@/components/orders/CoursesExpressStatusStepper';
import { LivreurCard } from '@/components/orders/LivreurCard';
import { NotationCard, type CibleANoter } from '@/components/orders/NotationCard';
import { OrderStatusStepper } from '@/components/orders/OrderStatusStepper';
import { PaiementStatus } from '@/components/paiement/PaiementStatus';
import { useAnnulerInvite, useNoterInvite, usePayerInvite, useSuiviInvite, type SuiviInvite } from '@/api/invite';
import { formatPrixFcfa } from '@/lib/format';
import { isStatutColisActif } from '@/lib/statut-colis';
import { isStatutCoursesExpressActif } from '@/lib/statut-courses-express';
import { isStatutRepasActif } from '@/lib/statut-repas';

// Everything the page needs, whatever the service.
function resume(suivi: SuiviInvite) {
  switch (suivi.typeService) {
    case 'repas': {
      const c = suivi.commande;
      return {
        titre: c.partenaire.nom,
        stepper: <OrderStatusStepper statut={c.statut} motifRefus={c.motifRefus} />,
        actif: isStatutRepasActif(c.statut),
        livree: c.statut === 'livree',
        close: c.statut === 'annulee' || c.statut === 'refusee',
        annulable: c.statut === 'en_attente_acceptation',
        partenaire: `Le restaurant ${c.partenaire.nom}`,
      };
    }
    case 'colis': {
      const c = suivi.commande;
      return {
        titre: `Colis pour ${c.destinataireNom}`,
        stepper: <ColisStatusStepper statut={c.statut} motif={c.motif} />,
        actif: isStatutColisActif(c.statut),
        livree: c.statut === 'livre',
        close: c.statut === 'annulee',
        annulable: c.statut === 'confirmee',
        partenaire: null,
      };
    }
    case 'courses_express': {
      const c = suivi.commande;
      return {
        titre: c.description,
        stepper: <CoursesExpressStatusStepper statut={c.statut} motif={c.motif} />,
        actif: isStatutCoursesExpressActif(c.statut),
        livree: c.statut === 'terminee',
        close: c.statut === 'annulee',
        annulable: c.statut === 'confirmee',
        partenaire: null,
      };
    }
  }
}

/** F-CLI-02 : suivi d'une commande passée sans compte, par son lien signé. */
export function SuiviInvitePage() {
  const { jeton } = useParams<{ jeton: string }>();
  const { data: suivi, isPending, isError } = useSuiviInvite(jeton);
  const payer = usePayerInvite(jeton);
  const annuler = useAnnulerInvite(jeton);
  const noter = useNoterInvite(jeton);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !suivi) {
    return (
      <p className="text-sm text-destructive">
        Lien de suivi invalide ou expiré. Vérifiez le lien reçu par WhatsApp ou SMS.
      </p>
    );
  }

  const r = resume(suivi);
  const generique = suivi.commande.commande;
  const cibles: CibleANoter[] = [
    ...(r.partenaire ? [{ cible: 'partenaire' as const, libelle: r.partenaire }] : []),
    ...(generique.livreur
      ? [{ cible: 'livreur' as const, libelle: `Votre livreur, ${generique.livreur.user.nom}` }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="line-clamp-2 text-xl font-semibold">{r.titre}</h1>
        <p className="text-sm text-muted-foreground">
          Commande sans compte du {new Date(suivi.commande.createdAt).toLocaleString('fr-FR')}
        </p>
      </div>

      {r.stepper}

      <PaiementStatus
        commandeId={generique.id}
        paiement={generique.paiement}
        montantTotal={generique.montantTotal}
        commandeClose={r.close}
        payer={{
          lancer: () => payer.mutate(undefined, { onError: (error) => toast.error(error.message) }),
          enCours: payer.isPending,
        }}
      />

      <LivreurCard livreur={generique.livreur} actif={r.actif} />

      {suivi.typeService === 'colis' && suivi.commande.codeOtp && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <p className="text-sm text-muted-foreground">
            Transmettez ce code au destinataire : il devra le donner au livreur à la remise.
          </p>
          <CopyableValue label="Code de remise" value={suivi.commande.codeOtp} />
          <CopyableValue
            label="Lien de suivi pour le destinataire"
            value={`${window.location.origin}/colis/suivi/${suivi.commande.id}`}
          />
        </div>
      )}

      {suivi.typeService === 'colis' && (suivi.commande.photoEnlevementUrl || suivi.commande.etatEnlevement) && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <p className="text-sm font-semibold">Photo lors de la prise en charge</p>
          {suivi.commande.etatEnlevement && (
            <p className="text-xs text-muted-foreground">Constat : {suivi.commande.etatEnlevement}</p>
          )}
          {suivi.commande.photoEnlevementUrl && (
            <a href={suivi.commande.photoEnlevementUrl} target="_blank" rel="noreferrer" className="block">
              <img
                src={suivi.commande.photoEnlevementUrl}
                alt="Prise en charge du colis"
                className="max-h-48 rounded-lg object-cover ring-1 ring-border hover:opacity-90"
              />
              <span className="mt-1 block text-xs text-brand-blue hover:underline">
                Voir la photo en plein format
              </span>
            </a>
          )}
        </div>
      )}

      {suivi.typeService === 'colis' && suivi.commande.photoPreuveUrl && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <p className="text-sm font-semibold">Photo de preuve de livraison</p>
          <a href={suivi.commande.photoPreuveUrl} target="_blank" rel="noreferrer" className="block">
            <img
              src={suivi.commande.photoPreuveUrl}
              alt="Preuve de livraison"
              className="max-h-48 rounded-lg object-cover ring-1 ring-border hover:opacity-90"
            />
            <span className="mt-1 block text-xs text-brand-blue hover:underline">
              Voir la photo en plein format
            </span>
          </a>
        </div>
      )}

      <div className="flex items-baseline justify-between border-t border-border pt-3">
        <span className="font-semibold">Total</span>
        <span className="font-heading text-xl font-semibold">
          {generique.montantTotal ? formatPrixFcfa(generique.montantTotal) : '—'}
        </span>
      </div>

      <NotationCard
        livree={r.livree}
        cibles={cibles}
        notations={generique.notations}
        enCours={noter.isPending}
        onNoter={(notes, callbacks) => noter.mutate(notes, callbacks)}
      />

      {r.annulable && (
        <Button
          variant="outline"
          className="w-full"
          disabled={annuler.isPending}
          onClick={() =>
            annuler.mutate(undefined, {
              onSuccess: () => toast.success('Commande annulée.'),
              onError: (error) => toast.error(error.message),
            })
          }
        >
          Annuler la commande
        </Button>
      )}

      <div className="space-y-2 rounded-lg bg-secondary/60 p-3">
        <p className="text-sm text-muted-foreground">
          Sans compte, ce lien est le seul accès à votre commande. Il vous a aussi été envoyé par WhatsApp ou SMS.
        </p>
        <CopyableValue label="Lien de cette page" value={window.location.href} />
      </div>
    </div>
  );
}
