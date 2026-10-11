import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotationCard, type CibleANoter } from './NotationCard';

const CIBLES: CibleANoter[] = [
  { cible: 'partenaire', libelle: 'Le restaurant Okoti Saveurs' },
  { cible: 'livreur', libelle: 'Votre livreur, Koffi' },
];

describe('NotationCard', () => {
  it('renders nothing before delivery', () => {
    const { container } = render(
      <NotationCard livree={false} cibles={CIBLES} notations={[]} enCours={false} onNoter={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('sends only the targets the client rated', async () => {
    const onNoter = vi.fn();
    render(<NotationCard livree cibles={CIBLES} notations={[]} enCours={false} onNoter={onNoter} />);

    const envoyer = screen.getByRole('button', { name: 'Envoyer mon avis' });
    expect(envoyer).toBeDisabled();

    const livreur = screen.getByRole('radiogroup', { name: 'Votre livreur, Koffi' });
    await userEvent.click(within(livreur).getByRole('radio', { name: /^4 sur 5/ }));
    await userEvent.type(screen.getByPlaceholderText(/commentaire/i), 'Rapide et poli');
    await userEvent.click(envoyer);

    expect(onNoter).toHaveBeenCalledWith(
      [{ cible: 'livreur', note: 4, commentaire: 'Rapide et poli' }],
      expect.any(Object),
    );
  });

  it('only offers what is left to rate, then thanks the client', () => {
    const { rerender } = render(
      <NotationCard
        livree
        cibles={CIBLES}
        notations={[{ cible: 'partenaire', note: 5 }]}
        enCours={false}
        onNoter={vi.fn()}
      />,
    );
    expect(screen.queryByRole('radiogroup', { name: 'Le restaurant Okoti Saveurs' })).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Votre livreur, Koffi' })).toBeInTheDocument();

    rerender(
      <NotationCard
        livree
        cibles={CIBLES}
        notations={[
          { cible: 'partenaire', note: 5 },
          { cible: 'livreur', note: 4 },
        ]}
        enCours={false}
        onNoter={vi.fn()}
      />,
    );
    expect(screen.getByText('Merci pour votre avis')).toBeInTheDocument();
  });
});
