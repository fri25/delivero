import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCartStore } from '@/stores/cart-store';
import { ADRESSE_KANTABORIFA, renderAvecDonnees } from '@/test/render-avec-donnees';
import { CartPage } from './CartPage';

function remplirPanier() {
  useCartStore.setState({
    restaurantId: 'r1',
    restaurantNom: 'Jardin de l’Atacora',
    items: [{ platId: 'p1', nom: 'Jus naturels', prixUnitaire: 800, quantite: 2 }],
  });
}

describe('CartPage', () => {
  it('shows an empty state with a way back to the restaurants', () => {
    useCartStore.setState({ restaurantId: null, restaurantNom: null, items: [] });
    renderAvecDonnees(<CartPage />);
    expect(screen.getByText('Votre panier est vide')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir les restaurants' })).toHaveAttribute('href', '/repas');
  });

  it('prices delivery from the address neighbourhood (RG-08 breakdown)', async () => {
    remplirPanier();
    renderAvecDonnees(<CartPage />);

    // Kantaborifa = 500; service 15 % × (1 600 + 500) = 315; total 2 415.
    expect(await screen.findByText('Quartier Kantaborifa')).toBeInTheDocument();
    expect(screen.getByText(/315 FCFA/)).toBeInTheDocument();
    expect(screen.getAllByText(/2\s415 FCFA/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tout est prêt.').length).toBeGreaterThan(0);
  });

  it('blocks an address saved without a neighbourhood and offers to complete it', async () => {
    remplirPanier();
    renderAvecDonnees(<CartPage />, {
      '/adresses': [{ ...ADRESSE_KANTABORIFA, quartierId: null, quartierTarifaire: null, quartier: null }],
    });

    expect(await screen.findByText(/Il manque : quartier de l’adresse de livraison/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Indiquer le quartier de « Maison »/ })).toBeInTheDocument();
    for (const bouton of screen.getAllByRole('button', { name: 'Commander et payer' })) expect(bouton).toBeDisabled();
  });
});
