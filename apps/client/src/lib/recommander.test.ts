import { describe, expect, it } from 'vitest';
import type { CommandeColis, CommandeCoursesExpress } from '@/api/types';
import { lireModele, modeleColis, modeleCoursesExpress } from './recommander';

describe('recommander', () => {
  it('keeps what a similar parcel needs, nothing tied to the old order', () => {
    const colis = {
      id: 'c1',
      statut: 'livre',
      taille: 'moyen',
      fragile: true,
      valeurDeclaree: '15000.00',
      destinataireNom: 'Bio',
      destinataireTelephone: '+2290197000000',
      adresseLivraison: 'Quartier Yokossi',
      pointDeRepereLivraison: 'Derrière la mosquée',
      codeOtp: '123456',
      adresseEnlevement: { id: 'a1', libelle: 'Maison', pointDeRepere: 'Portail bleu' },
      zone: { id: 'z1', nom: 'Centre' },
    } as unknown as CommandeColis;

    expect(modeleColis(colis)).toEqual({
      adresseEnlevementId: 'a1',
      zoneId: 'z1',
      taille: 'moyen',
      destinataireNom: 'Bio',
      destinataireTelephone: '+2290197000000',
      adresseLivraison: 'Quartier Yokossi',
      pointDeRepereLivraison: 'Derrière la mosquée',
      valeurDeclaree: '15000',
      fragile: true,
    });
  });

  it('copies the errand steps in order', () => {
    const course = {
      description: 'Déposer un dossier',
      zone: { id: 'z1', nom: 'Centre' },
      etapes: [
        { description: 'Récupérer', pointDeRepere: 'Mairie', adresse: null },
        { description: 'Déposer', pointDeRepere: 'Banque', adresse: 'Rue 2' },
      ],
    } as unknown as CommandeCoursesExpress;

    expect(modeleCoursesExpress(course).etapes).toEqual([
      { description: 'Récupérer', pointDeRepere: 'Mairie', adresse: '' },
      { description: 'Déposer', pointDeRepere: 'Banque', adresse: 'Rue 2' },
    ]);
  });

  it('reads the template from router state, tolerating anything else', () => {
    expect(lireModele<{ a: number }>({ modele: { a: 1 } })).toEqual({ a: 1 });
    expect(lireModele(null)).toBeUndefined();
    expect(lireModele({ autre: true })).toBeUndefined();
  });
});
