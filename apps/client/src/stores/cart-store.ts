import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  platId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  instructions?: string;
}

interface CartState {
  restaurantId: string | null;
  restaurantNom: string | null;
  items: CartItem[];
  hasConflict: (restaurantId: string) => boolean;
  addItem: (restaurantId: string, restaurantNom: string, item: CartItem) => void;
  updateQuantity: (platId: string, quantite: number) => void;
  removeItem: (platId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantNom: null,
      items: [],

      hasConflict: (restaurantId) => {
        const state = get();
        return state.items.length > 0 && state.restaurantId !== null && state.restaurantId !== restaurantId;
      },

      addItem: (restaurantId, restaurantNom, item) => {
        const state = get();
        const sameRestaurant = state.restaurantId === restaurantId;
        const items = sameRestaurant ? state.items : [];
        const existing = items.find((i) => i.platId === item.platId);
        const nextItems = existing
          ? items.map((i) => (i.platId === item.platId ? { ...i, quantite: i.quantite + item.quantite } : i))
          : [...items, item];
        set({ restaurantId, restaurantNom, items: nextItems });
      },

      updateQuantity: (platId, quantite) =>
        set((state) => ({
          items:
            quantite <= 0
              ? state.items.filter((i) => i.platId !== platId)
              : state.items.map((i) => (i.platId === platId ? { ...i, quantite } : i)),
        })),

      removeItem: (platId) => set((state) => ({ items: state.items.filter((i) => i.platId !== platId) })),

      clear: () => set({ restaurantId: null, restaurantNom: null, items: [] }),
    }),
    { name: 'delivero-cart' },
  ),
);
