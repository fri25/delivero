import { describe, expect, it } from 'vitest';
import {
  codeService,
  decouperNom,
  ENTREPRISE_PAR_DEFAUT,
  estOuvert,
  lienWhatsAppSupport,
  numeroLocal,
} from '@delivero/config/entreprise';

// Étape 6 of docs/plan-migration-multi-tenant.md: the apps take the company's
// identity from the API. For CHAP EXPRESS the display must not change.
describe('identité de l’entreprise', () => {
  it('CHAP EXPRESS garde son logotype en deux couleurs', () => {
    expect(decouperNom('ChapExpress')).toEqual(['Chap', 'Express']);
  });

  it('un autre nom reste d’un seul tenant', () => {
    expect(decouperNom('Livraisons B')).toEqual(['Livraisons B', '']);
    expect(decouperNom('Rapide')).toEqual(['Rapide', '']);
  });

  it('affiche le numéro du support comme avant', () => {
    expect(numeroLocal(ENTREPRISE_PAR_DEFAUT, ENTREPRISE_PAR_DEFAUT.whatsappSupport)).toBe('01 57 86 69 59');
    expect(lienWhatsAppSupport(ENTREPRISE_PAR_DEFAUT)).toBe('https://wa.me/2290157866959');
  });

  it('ouvre par défaut les services de la V1', () => {
    expect(estOuvert(ENTREPRISE_PAR_DEFAUT, codeService('/repas'))).toBe(true);
    expect(estOuvert(ENTREPRISE_PAR_DEFAUT, codeService('/courses-express'))).toBe(true);
    expect(estOuvert(ENTREPRISE_PAR_DEFAUT, codeService('/emplettes'))).toBe(false);
  });

  it('reprend la commission de CHAP EXPRESS', () => {
    expect(ENTREPRISE_PAR_DEFAUT.tauxCommission).toBe(15);
  });
});
