import { ESPECES_ACTIF } from '@delivero/config/perimetre-v1';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { AddressPicker } from '@/components/adresses/AddressPicker';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { useCreateCommandeRepas } from '@/api/commandes-repas';
import { useApresCreationCommande } from '@/api/paiements';
import { useRestaurant } from '@/api/restaurants';
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
import type { ModePaiement } from '@/api/types';

export function CartPage() {
  const token = useAuthStore((state) => state.token);
  const cart = useCartStore();
  const createCommande = useCreateCommandeRepas();
  const apresCreation = useApresCreationCommande();
  const creerInvite = useCreerCommandeInvite<CommandeRepasInviteInput>('repas');
  const apresCreationInvite = useApresCreationInvite();
  const envoiEnCours = createCommande.isPending || apresCreation.isPending || creerInvite.isPending;
  const { data: restaurant } = useRestaurant(cart.restaurantId ?? undefined);

  const [adresseId, setAdresseId] = useState<string | null>(null);
  // F-CLI-02 : commande sans compte.
  const [sansCompte, setSansCompte] = useState(false);
  const [contact, setContact] = useState<ContactInvite>({ nom: '', telephone: '' });
  const [adresseInvite, setAdresseInvite] = useState<AdresseInvite>({ pointDeRepere: '' });
  const [modePaiement, setModePaiement] = useState<ModePaiement>(
    ESPECES_ACTIF ? 'especes' : 'mobile_money',
  );

  const sousTotal = cart.items.reduce((sum, item) => sum + item.prixUnitaire * item.quantite, 0);
  // Décompte transparent (RG-08) : frais de livraison + 15 % de service,
  // calculés sur (plats + livraison) — même formule que côté API.
  const fraisLivraison = restaurant ? Number(restaurant.fraisLivraison) : undefined;
  const fraisService =
    fraisLivraison !== undefined ? Math.round((sousTotal + fraisLivraison) * 0.15) : undefined;
  const total = sousTotal + (fraisLivraison ?? 0) + (fraisService ?? 0);

  if (cart.items.length === 0) {
    return <p className="text-sm text-muted-foreground">Votre panier est vide.</p>;
  }

  const lignes = cart.items.map((item) => ({
    platId: item.platId,
    quantite: item.quantite,
    instructions: item.instructions,
  }));

  const commanderSansCompte = () => {
    if (!cart.restaurantId) return;
    if (!contact.nom.trim() || !contact.telephone.trim() || !adresseInvite.pointDeRepere.trim()) {
      toast.error('Indiquez votre nom, votre téléphone et un point de repère.');
      return;
    }
    creerInvite.mutate(
      { invite: contact, adresse: adresseInvite, partenaireId: cart.restaurantId, modePaiement, lignes },
      {
        onSuccess: (creee) => {
          cart.clear();
          void apresCreationInvite(creee, { mode: modePaiement, statut: 'en_attente' });
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const commander = () => {
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

    createCommande.mutate(
      {
        partenaireId: cart.restaurantId,
        adresseId,
        modePaiement,
        lignes,
      },
      {
        onSuccess: (commande) => {
          cart.clear();
          apresCreation.continuer(commande, `/commandes/${commande.id}`, 'Commande envoyée au restaurant !');
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Votre panier</h1>
        <p className="text-sm text-muted-foreground">{cart.restaurantNom}</p>
      </div>

      <div>
        {cart.items.map((item) => (
          <CartItemRow
            key={item.platId}
            item={item}
            onUpdateQuantity={cart.updateQuantity}
            onRemove={cart.removeItem}
          />
        ))}
      </div>

      <div className="space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Sous-total plats</span>
          <span>{formatPrixFcfa(sousTotal)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Frais de livraison</span>
          <span>{fraisLivraison !== undefined ? formatPrixFcfa(fraisLivraison) : '—'}</span>
        </div>
        <div className="flex items-start justify-between gap-3 text-muted-foreground">
          <span>
            Frais de service ChapExpress
            <span className="block text-xs">15 % des plats + livraison</span>
          </span>
          <span className="shrink-0">
            {fraisService !== undefined ? formatPrixFcfa(fraisService) : '—'}
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2 text-foreground">
          <span className="font-semibold">À payer</span>
          <span className="font-heading text-2xl font-semibold">{formatPrixFcfa(total)}</span>
        </div>
      </div>

      {!token && !sansCompte && <ChoixCompteInvite onSansCompte={() => setSansCompte(true)} />}

      {(token || sansCompte) && (
        <div className="space-y-4">
          {token ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Adresse de livraison</h2>
              <AddressPicker value={adresseId} onChange={setAdresseId} />
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Vos coordonnées</h2>
              <ContactInviteFields value={contact} onChange={setContact} />
              <AdresseInviteFields
                id="adresse-livraison-invite"
                label="Point de repère pour la livraison"
                value={adresseInvite}
                onChange={setAdresseInvite}
              />
            </div>
          )}

          <div>
            <h2 className="mb-2 text-sm font-semibold">Paiement</h2>
            {/* Espèces retirées de la V1 : plus qu'un seul moyen, on annonce
                le paiement au lieu de simuler un choix (voir
                packages/config/perimetre-v1.ts). */}
            {ESPECES_ACTIF ? (
              <Select value={modePaiement} onValueChange={(value) => setModePaiement(value as ModePaiement)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces à la livraison</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="rounded-lg border border-border px-3 py-2 text-sm">Mobile Money</p>
            )}
          </div>
        </div>
      )}

      {(token || sansCompte) && (
        <Button className="w-full" disabled={envoiEnCours} onClick={commander}>
          {envoiEnCours ? 'Envoi...' : ESPECES_ACTIF ? 'Commander' : 'Commander et payer'}
        </Button>
      )}
    </div>
  );
}
