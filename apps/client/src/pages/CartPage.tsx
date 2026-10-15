import { ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Plus, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChoiceCards } from '@/components/forms/ChoiceCards';
import { FormStep } from '@/components/forms/FormStep';
import { SubmitBar } from '@/components/forms/SubmitBar';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { AddressPicker } from '@/components/adresses/AddressPicker';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { useCreateCommandeRepas } from '@/api/commandes-repas';
import { useApresCreationCommande } from '@/api/paiements';
import { useAdresses } from '@/api/adresses';
import { useQuartiers } from '@/api/quartiers';
import {
  useApresCreationInvite,
  useCreerCommandeInvite,
  type AdresseInvite,
  type CommandeRepasInviteInput,
  type ContactInvite,
} from '@/api/invite';
import { AdresseInviteFields } from '@/components/invite/AdresseInviteFields';
import { ChoixCompteInvite } from '@/components/invite/ChoixCompteInvite';
import { ContactInviteFields } from '@/components/invite/ContactInviteFields';
import { formatPrixFcfa } from '@/lib/format';
import { choixQuartierComplet, quartierChoisi } from '@/lib/quartiers';
import type { ModePaiement } from '@/api/types';

export function CartPage() {
  const token = useAuthStore((state) => state.token);
  const cart = useCartStore();
  const createCommande = useCreateCommandeRepas();
  const apresCreation = useApresCreationCommande();
  const creerInvite = useCreerCommandeInvite<CommandeRepasInviteInput>('repas');
  const apresCreationInvite = useApresCreationInvite();
  const envoiEnCours = createCommande.isPending || apresCreation.isPending || creerInvite.isPending;
  const { data: adresses } = useAdresses();
  const { data: quartiers } = useQuartiers();

  const [adresseId, setAdresseId] = useState<string | null>(null);
  // F-CLI-02 : commande sans compte.
  const [sansCompte, setSansCompte] = useState(false);
  const [contact, setContact] = useState<ContactInvite>({ nom: '', telephone: '' });
  const [adresseInvite, setAdresseInvite] = useState<AdresseInvite>({ quartierId: '', pointDeRepere: '' });
  const [modePaiement, setModePaiement] = useState<ModePaiement>(
    ESPECES_ACTIF ? 'especes' : 'mobile_money',
  );
  const submissionLock = useRef(false);

  const sousTotal = cart.items.reduce((sum, item) => sum + item.prixUnitaire * item.quantite, 0);
  // Décompte transparent (RG-08) : frais de livraison + 15 % de service,
  // calculés sur (plats + livraison) — même formule que côté API. Les frais
  // de livraison sont ceux du quartier de livraison (Q-28, 13/10).
  const quartierLivraison = token
    ? adresses?.find((adresse) => adresse.id === adresseId)?.quartierTarifaire
    : quartierChoisi({ quartierId: adresseInvite.quartierId, precision: '' }, quartiers);
  const fraisLivraison = quartierLivraison ? Number(quartierLivraison.fraisLivraison) : undefined;
  const fraisService =
    fraisLivraison !== undefined ? Math.round((sousTotal + fraisLivraison) * 0.15) : undefined;
  const total = sousTotal + (fraisLivraison ?? 0) + (fraisService ?? 0);

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-card px-6 py-12 text-center border border-border/70 shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-xs">
          <ShoppingCart className="size-8" aria-hidden="true" />
        </div>
        <h1 className="font-heading mt-5 text-xl font-bold text-foreground">Votre panier est vide</h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          Choisissez un restaurant à Natitingou et ajoutez vos plats avec le bouton +.
        </p>
        <Button asChild size="lg" className="mt-6 rounded-xl font-semibold shadow-md shadow-primary/20">
          <Link to="/repas">Voir les restaurants</Link>
        </Button>
      </div>
    );
  }

  const lignes = cart.items.map((item) => ({
    platId: item.platId,
    quantite: item.quantite,
    instructions: item.instructions,
  }));

  const commanderSansCompte = () => {
    if (submissionLock.current || envoiEnCours) return;
    if (!cart.restaurantId) return;
    if (!contact.nom.trim() || !contact.telephone.trim() || !adresseInvite.pointDeRepere.trim() || !adresseInvite.quartierId) {
      toast.error('Indiquez votre nom, votre téléphone, votre quartier et un point de repère.');
      return;
    }
    submissionLock.current = true;
    creerInvite.mutate(
      { invite: contact, adresse: adresseInvite, partenaireId: cart.restaurantId, modePaiement, lignes },
      {
        onSuccess: (creee) => {
          cart.clear();
          void apresCreationInvite(creee, { mode: modePaiement, statut: 'en_attente' });
        },
        onError: (error) => toast.error(error.message),
        onSettled: () => {
          submissionLock.current = false;
        },
      },
    );
  };

  const commander = async () => {
    if (submissionLock.current || envoiEnCours) return;
    if (!token) {
      commanderSansCompte();
      return;
    }
    if (!adresseId) {
      toast.error('Choisissez une adresse de livraison.');
      return;
    }
    if (!cart.restaurantId) {
      return;
    }

    submissionLock.current = true;
    try {
      const commande = await createCommande.mutateAsync({
        partenaireId: cart.restaurantId,
        adresseId,
        modePaiement,
        lignes,
      });
      cart.clear();
      apresCreation.continuer(commande, `/commandes/${commande.id}`, 'Commande envoyée au restaurant !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'La commande n’a pas pu être envoyée. Réessayez.');
    } finally {
      submissionLock.current = false;
    }
  };

  // In form order: the SubmitBar names the first one.
  const manquant: string[] = [];
  if (token && !adresseId) manquant.push('adresse de livraison');
  if (token && adresseId && !quartierLivraison) manquant.push('quartier de l’adresse de livraison');
  if (!token && !sansCompte) manquant.push('se connecter ou continuer sans compte');
  if (!token && sansCompte) {
    if (!contact.nom.trim()) manquant.push('votre nom');
    if (!contact.telephone.trim()) manquant.push('votre téléphone');
    if (!choixQuartierComplet({ quartierId: adresseInvite.quartierId, precision: adresseInvite.quartier ?? '' }, quartiers))
      manquant.push('votre quartier');
    if (!adresseInvite.pointDeRepere.trim()) manquant.push('point de repère de livraison');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 lg:max-w-6xl lg:space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold lg:text-3xl text-foreground">Votre panier</h1>
          {cart.restaurantId && (
            <p className="mt-1 text-sm text-muted-foreground">
              Commande préparée par{' '}
              <Link to={`/restaurants/${cart.restaurantId}`} className="font-bold text-primary hover:underline">
                {cart.restaurantNom}
              </Link>
            </p>
          )}
        </div>
      </header>

      {!navigator.onLine && (
        <p role="status" className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          Vous êtes hors ligne. Votre panier est conservé sur cet appareil ; vous pourrez commander dès le retour du
          réseau.
        </p>
      )}

      {/* Desktop: steps on the left, sticky summary on the right. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="space-y-4">
          <FormStep numero={1} titre="Vos plats" complete>
            <div className="divide-y divide-border/60">
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.platId}
                  item={item}
                  onUpdateQuantity={cart.updateQuantity}
                  onRemove={cart.removeItem}
                />
              ))}
            </div>
            {cart.restaurantId && (
              <div className="pt-2">
                <Link
                  to={`/restaurants/${cart.restaurantId}`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline"
                >
                  <Plus className="size-4" aria-hidden="true" /> Ajouter d’autres plats
                </Link>
              </div>
            )}

            {/* Décompte transparent (RG-08). */}
            <dl className="space-y-2 rounded-2xl bg-secondary/50 p-4 text-xs sm:text-sm border border-border/60">
              <div className="flex justify-between text-muted-foreground">
                <dt>Plats</dt>
                <dd className="font-medium text-foreground">{formatPrixFcfa(sousTotal)}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>
                  Livraison
                  {quartierLivraison && <span className="block text-xs text-muted-foreground/80">Quartier {quartierLivraison.nom}</span>}
                </dt>
                <dd className="shrink-0 font-medium text-foreground">
                  {fraisLivraison !== undefined ? formatPrixFcfa(fraisLivraison) : 'selon le quartier'}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-muted-foreground">
                <dt>
                  Frais de service ChapExpress
                  <span className="block text-xs text-muted-foreground/80">15 % des plats + livraison</span>
                </dt>
                <dd className="shrink-0 font-medium text-foreground">{fraisService !== undefined ? formatPrixFcfa(fraisService) : '—'}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-border/70 pt-2.5 text-foreground">
                <dt className="font-bold">Total à payer</dt>
                <dd className="font-heading text-xl font-bold text-primary">
                  {fraisLivraison !== undefined ? formatPrixFcfa(total) : '—'}
                </dd>
              </div>
            </dl>
          </FormStep>

          <FormStep
            numero={2}
            titre="Où livrer ?"
            aide="Le livreur se repère avec le point de repère : soyez précis."
            complete={manquant.length === 0}
          >
            {token ? (
              <AddressPicker value={adresseId} onChange={setAdresseId} />
            ) : sansCompte ? (
              <div className="space-y-4">
                <ContactInviteFields value={contact} onChange={setContact} />
                <AdresseInviteFields
                  id="adresse-livraison-invite"
                  label="Point de repère pour la livraison"
                  value={adresseInvite}
                  onChange={setAdresseInvite}
                />
              </div>
            ) : (
              <ChoixCompteInvite onSansCompte={() => setSansCompte(true)} />
            )}
          </FormStep>

          <FormStep numero={3} titre="Paiement">
            {/* Espèces retirées de la V1 : plus qu'un seul moyen, on annonce
                le paiement au lieu de simuler un choix (voir
                packages/config/perimetre-v1.ts). */}
            {ESPECES_ACTIF ? (
              <ChoiceCards
                name="Mode de paiement"
                colonnes={2}
                value={modePaiement}
                options={[
                  { value: 'mobile_money', label: 'Mobile Money', detail: 'Payé maintenant' },
                  { value: 'especes', label: 'Espèces', detail: 'Payé à la livraison' },
                ]}
                onChange={setModePaiement}
              />
            ) : (
              <p className="rounded-xl bg-secondary px-3 py-2.5 text-sm">
                <span className="font-medium">Mobile Money</span>
                <span className="text-muted-foreground">
                  {' '}
                  — vous payez à la confirmation ; le restaurant reçoit la commande dès le paiement reçu.
                </span>
              </p>
            )}
          </FormStep>
        </div>

        <SubmitBar
          titre="Votre commande"
          tarif={fraisLivraison !== undefined ? total : undefined}
          tarifLabel="Total à payer"
          manquant={manquant}
          enCours={envoiEnCours}
          libelle={ESPECES_ACTIF ? 'Commander' : 'Commander et payer'}
          onConfirmer={() => void commander()}
        />
      </div>
    </div>
  );
}
