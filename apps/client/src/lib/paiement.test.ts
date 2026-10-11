import { describe, expect, it } from 'vitest';
import { doitEtrePaye } from './paiement';

describe('doitEtrePaye', () => {
  it('asks to pay a pending or failed Mobile Money payment', () => {
    expect(doitEtrePaye({ mode: 'mobile_money', statut: 'en_attente' })).toBe(true);
    expect(doitEtrePaye({ mode: 'mobile_money', statut: 'echoue' })).toBe(true);
  });

  it('does not ask once paid, refunded, or for cash', () => {
    expect(doitEtrePaye({ mode: 'mobile_money', statut: 'reussi' })).toBe(false);
    expect(doitEtrePaye({ mode: 'mobile_money', statut: 'a_rembourser' })).toBe(false);
    expect(doitEtrePaye({ mode: 'especes', statut: 'a_percevoir_livraison' })).toBe(false);
    expect(doitEtrePaye(null)).toBe(false);
  });
});
