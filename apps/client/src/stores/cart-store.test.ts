import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from './cart-store';

const plat = (platId: string, quantite = 1) => ({ platId, nom: platId, prixUnitaire: 1000, quantite });

describe('cart store', () => {
  beforeEach(() => useCartStore.getState().clear());

  it('merges quantities for the same dish', () => {
    const { addItem } = useCartStore.getState();
    addItem('r1', 'Resto 1', plat('p1'));
    addItem('r1', 'Resto 1', plat('p1', 2));
    expect(useCartStore.getState().items).toEqual([plat('p1', 3)]);
  });

  it('starts a new cart when the restaurant changes', () => {
    const { addItem, hasConflict } = useCartStore.getState();
    addItem('r1', 'Resto 1', plat('p1'));
    expect(hasConflict('r2')).toBe(true);
    addItem('r2', 'Resto 2', plat('p9'));
    const state = useCartStore.getState();
    expect(state.restaurantId).toBe('r2');
    expect(state.items).toEqual([plat('p9')]);
  });

  it('removes a dish whose quantity drops to 0', () => {
    const { addItem, updateQuantity } = useCartStore.getState();
    addItem('r1', 'Resto 1', plat('p1'));
    updateQuantity('p1', 0);
    expect(useCartStore.getState().items).toEqual([]);
  });
});
