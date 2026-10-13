import { Link, useParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { modeleColis } from '@/lib/recommander';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnnulerCommandeColis, useCommandeColis } from '@/api/commandes-colis';
import { ColisStatusStepper } from '@/components/orders/ColisStatusStepper';
import { CopyableValue } from '@/components/colis/CopyableValue';
import { PaiementStatus } from '@/components/paiement/PaiementStatus';
import { LivreurCard } from '@/components/orders/LivreurCard';
import { NotationCard } from '@/components/orders/NotationCard';
import { CarteDetail } from '@/components/orders/CarteDetail';
import { DetailCommandeLayout } from '@/components/orders/DetailCommandeLayout';
import { useNoterCommande } from '@/api/notations';
import { isStatutColisActif } from '@/lib/statut-colis';
import { formatPrixFcfa } from '@/lib/format';
import { miniature } from '@/lib/medias';
import { LoadError } from '@/components/layout/LoadError';

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  especes: 'Espèces à la livraison',
  mobile_money: 'Mobile Money',
};

const TAILLE_LABELS: Record<string, string> = { petit: 'Petit', moyen: 'Moyen', grand: 'Grand' };

export function ColisOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: commande, isPending, isError, refetch } = useCommandeColis(id);
  const annuler = useAnnulerCommandeColis();
  const noter = useNoterCommande(['commande-colis', id]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) return <LoadError message="Le suivi de ce colis n’a pas pu être chargé." onRetry={() => void refetch()} />;

  if (!commande) {
    return <p className="text-sm text-destructive">Commande introuvable.</p>;
  }

  const actif = isStatutColisActif(commande.statut);
  const lienSuivi = `${window.location.origin}/colis/suivi/${commande.id}`;
  const dateRemise = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Porto-Novo',
  }).format(new Date(commande.updatedAt));

  return (
    <DetailCommandeLayout
      service="Colis"
      titre={`Colis pour ${commande.destinataireNom}`}
      date={commande.createdAt}
      reference={commande.commande.id}
      suivi={<ColisStatusStepper statut={commande.statut} motif={commande.motif} paiement={commande.commande.paiement} />}
      actions={
        <>
          <PaiementStatus
            commandeId={commande.commande.id}
            paiement={commande.commande.paiement}
            montantTotal={commande.commande.montantTotal}
            commandeClose={commande.statut === 'annulee'}
          />
          <LivreurCard livreur={commande.commande.livreur} actif={actif} />

          {/* RG-07 : le destinataire donne ce code au livreur à la remise. */}
          {commande.codeOtp && actif && (
            <CarteDetail titre="À transmettre au destinataire">
              <p className="mb-3 text-sm text-muted-foreground">
                Il devra donner ce code au livreur pour recevoir le colis. Envoyez-lui aussi le lien de suivi.
              </p>
              <div className="space-y-3">
                <CopyableValue label="Code de remise" value={commande.codeOtp} />
                <CopyableValue label="Lien de suivi" value={lienSuivi} />
              </div>
            </CarteDetail>
          )}

          {!actif && (
            <Button asChild size="lg" className="w-full">
              <Link to="/colis" state={{ modele: modeleColis(commande) }}>
                <RotateCcw aria-hidden="true" />
                Envoyer un colis similaire
              </Link>
            </Button>
          )}
          {commande.statut === 'confirmee' && (
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              disabled={annuler.isPending}
              onClick={() => {
                annuler.mutate(commande.id, {
                  onSuccess: () => toast.success('Commande annulée.'),
                  onError: (error) => toast.error(error.message),
                });
              }}
            >
              Annuler l’envoi
            </Button>
          )}
        </>
      }
    >
      <NotationCard
        livree={commande.statut === 'livre'}
        cibles={[
          ...(commande.commande.livreur
            ? [{ cible: 'livreur' as const, libelle: `Votre livreur, ${commande.commande.livreur.user.nom}` }]
            : []),
        ]}
        notations={commande.commande.notations}
        enCours={noter.isPending}
        onNoter={(notes, callbacks) => noter.mutate({ commandeId: commande.commande.id, notes }, callbacks)}
      />

      {/* F-CLI-22 : preuve de remise (code obligatoire à la livraison, RG-07). */}
      {commande.statut === 'livre' && (
        <CarteDetail titre="Preuve de remise">
          <p className="text-sm text-muted-foreground">Remis le {dateRemise}.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">Réceptionnaire</p>
              <p className="mt-1 font-semibold">{commande.nomReceptionnaire || 'Nom non renseigné'}</p>
            </div>
            {commande.codeOtp && (
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">Code de remise vérifié</p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-[0.2em]">{commande.codeOtp}</p>
              </div>
            )}
          </div>
        </CarteDetail>
      )}

      <CarteDetail
        titre="Détails de l’envoi"
        action={commande.fragile ? <Badge variant="outline">Fragile</Badge> : undefined}
      >
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Enlèvement</dt>
            <dd className="mt-0.5">{commande.adresseEnlevement.pointDeRepere}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Livraison</dt>
            <dd className="mt-0.5">
              {commande.destinataireNom} · {commande.destinataireTelephone}
              <span className="block text-muted-foreground">
                {commande.pointDeRepereLivraison}
                {commande.adresseLivraison ? ` — ${commande.adresseLivraison}` : ''}
              </span>
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-muted-foreground">Taille</dt>
              <dd className="mt-0.5">{TAILLE_LABELS[commande.taille] ?? commande.taille}</dd>
            </div>
            {commande.valeurDeclaree && (
              <div>
                <dt className="text-xs text-muted-foreground">Valeur déclarée</dt>
                <dd className="mt-0.5">{formatPrixFcfa(commande.valeurDeclaree)}</dd>
              </div>
            )}
          </div>
          {commande.montantContreRemboursement && (
            <div>
              <dt className="text-xs text-muted-foreground">Contre-remboursement à encaisser</dt>
              <dd className="mt-0.5">{formatPrixFcfa(commande.montantContreRemboursement)}</dd>
            </div>
          )}
        </dl>

        {commande.photoUrl && (
          <a href={commande.photoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block">
            <img
              src={miniature(commande.photoUrl)}
              alt="Photo du colis"
              loading="lazy"
              className="size-24 rounded-xl object-cover ring-1 ring-foreground/10"
            />
          </a>
        )}

        <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
          {commande.commande.paiement && (
            <div className="flex justify-between text-muted-foreground">
              <dt>Paiement</dt>
              <dd>{MODE_PAIEMENT_LABELS[commande.commande.paiement.mode] ?? commande.commande.paiement.mode}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between text-foreground">
            <dt className="font-semibold">Total</dt>
            <dd className="font-heading text-xl font-semibold">
              {commande.commande.montantTotal ? formatPrixFcfa(commande.commande.montantTotal) : '—'}
            </dd>
          </div>
        </dl>
      </CarteDetail>
    </DetailCommandeLayout>
  );
}
