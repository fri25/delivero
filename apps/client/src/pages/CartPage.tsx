import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useRestaurant } from '@/api/restaurants';
import { formatPrixFcfa } from '@/lib/format';
import type { ModePaiement } from '@/api/types';

export function CartPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const cart = useCartStore();
  const createCommande = useCreateCommandeRepas();
  const { data: restaurant } = useRestaurant(cart.restaurantId ?? undefined);

  const [adresseId, setAdresseId] = useState<string | null>(null);
  const [modePaiement, setModePaiement] = useState<ModePaiement>('especes');

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

  const commander = () => {
    if (!token) {
      toast.info('Connectez-vous pour finaliser votre commande.');
      navigate('/connexion');
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
        lignes: cart.items.map((item) => ({
          platId: item.platId,
          quantite: item.quantite,
          instructions: item.instructions,
        })),
      },
      {
        onSuccess: (commande) => {
          cart.clear();
          toast.success('Commande envoyée au restaurant !');
          navigate(`/commandes/${commande.id}`);
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
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Frais de service ChapExpress (15 %)</span>
          <span>{fraisService !== undefined ? formatPrixFcfa(fraisService) : '—'}</span>
        </div>
        <div className="flex items-center justify-between pt-1 font-medium text-foreground">
          <span>Total</span>
          <span>{formatPrixFcfa(total)}</span>
        </div>
      </div>

      {token && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold">Adresse de livraison</h2>
            <AddressPicker value={adresseId} onChange={setAdresseId} />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold">Paiement</h2>
            <Select value={modePaiement} onValueChange={(value) => setModePaiement(value as ModePaiement)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="especes">Espèces à la livraison</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Button className="w-full" disabled={createCommande.isPending} onClick={commander}>
        {createCommande.isPending ? 'Envoi...' : token ? 'Commander' : 'Se connecter pour commander'}
      </Button>
    </div>
  );
}
